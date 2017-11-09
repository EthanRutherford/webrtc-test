const {Component} = require("react");
const PropTypes = require("prop-types");
const j = require("react-jenny");
const {
	Renderer,
	Scene,
	rgba,
	builtIn: {
		OrthoCamera,
	},
} = require("2d-gl");
const {fork, Math: {Vector2D}, Solver} = require("boxjs");
const Facilitator = require("../common/rtc-facilitator");
const {
	physTarget,
	maxSteps,
	getGetVisibleFunc,
	vLerp,
	aLerp,
} = require("./util");
const {ResourceManager} = require("./resources");
const BMSG = require("./bmsg");
const {Ping, Pong, BodyState, CreateAction, Message} = require("./serial");

const frameBufferSize = 3;

class Game extends Component {
	componentDidMount() {
		this.isMaster = this.props.id === 0;

		this.solver = new Solver();
		const gravityAcceleration = new Vector2D(0, -9.8);
		this.solver.applyG = (bodies) => {
			for (const body of bodies) {
				body.applyForce(gravityAcceleration.times(body.mass.m));
			}
		};

		this.renderer = new Renderer(this.canvas);
		this.scene = new Scene({bgColor: rgba(.1, .1, .1, 1)});
		this.camera = new OrthoCamera(0, 0, 20);
		this.scene.getVisibleFunc = getGetVisibleFunc(this);

		this.resourceManager = new ResourceManager(
			this.solver, this.renderer, this.scene,
		);

		this.resourceManager.createGround();

		this.myNextBody = 0;
		this.peerBodies = {[this.props.id]: {}};

		this.storedFrame = fork(this.solver);
		this.storedFrameOffset = 0;
		this.packets = {};
		this.actions = {};

		// set up step/render loop
		this.stepLoop = this.stepLoop.bind(this);
		this.animLoop = this.animLoop.bind(this);
		this.currentFrame = this.props.initialFrame || 0;
		this.acc = 0;
		this.timestamp = this.props.initialTimestamp || performance.now();
		this.frameZero = this.props.frameZero || Date.now();
		setInterval(this.stepLoop, physTarget * 1000);
		requestAnimationFrame(this.animLoop);

		// set up data handler
		this.props.facilitator.onData(this.onData.bind(this));

		// add keydown handler
		window.addEventListener("keydown", this.onKeyDown.bind(this));
	}
	onData(data, peer) {
		const message = BMSG.parse(data);

		if (message instanceof Ping) {
			peer.send(BMSG.bytify(new Pong(
				message.timestamp,
				this.frameZero,
			)));

			return;
		}

		if (!(message instanceof Message)) {
			return;
		}

		for (let frameId of Object.keys(message.actions)) {
			frameId = Number.parseInt(frameId, 10);
			if (frameId < this.currentFrame - frameBufferSize) {
				continue;
			}

			const frame = message.actions[frameId];
			if (!(frameId in this.actions)) {
				this.actions[frameId] = {};
			}

			const ourFrame = this.actions[frameId];

			for (const peerId of Object.keys(frame)) {
				if (!(peerId in ourFrame)) {
					ourFrame[peerId] = frame[peerId];
				}
			}
		}

		if (message.frame < this.currentFrame - frameBufferSize) {
			return;
		}

		if (!(message.frame in this.packets)) {
			this.packets[message.frame] = message;
		}
	}
	addAction() {
		const id = this.props.id;
		const frame = this.currentFrame;
		const action = new CreateAction(
			this.myNextBody++, 0, 5, Math.random(),
		);

		if (!(frame in this.actions)) {
			this.actions[frame] = {};
		}

		if (id in this.actions[frame]) {
			return;
		}

		this.actions[frame] = {[id]: action};
		this.props.facilitator.broadcast(BMSG.bytify(
			new Message({}, {[frame]: {[id]: action}}, 0),
		));
	}
	resolveFrame(solver, packet) {
		if (packet == null) {
			return;
		}

		for (const peerId of Object.keys(packet.bodies)) {
			const peer = packet.bodies[peerId];
			if (!(peerId in this.peerBodies)) {
				this.peerBodies[peerId] = {};
			}

			const ourPeer = this.peerBodies[peerId];
			for (const bodyId of Object.keys(peer)) {
				const {x, y, r, vx, vy, vr} = peer[bodyId];

				if (!(bodyId in ourPeer)) {
					const box = this.resourceManager.createBox({
						x, y, r, vx, vy, vr, solver,
					});
					ourPeer[bodyId] = box.id;
				} else {
					const body = solver.bodyMap[ourPeer[bodyId]];
					body.position.x = x;
					body.position.y = y;
					body.transform.radians = r;
					body.velocity.x = vx;
					body.velocity.y = vy;
					body.angularVelocity = vr;
				}
			}
		}
	}
	performActions(solver, actions) {
		if (actions == null) {
			return;
		}

		for (const peerId of Object.keys(actions)) {
			const {id, x, y, r} = actions[peerId];
			if (!(peerId in this.peerBodies)) {
				this.peerBodies[peerId] = {};
			}

			const ourPeer = this.peerBodies[peerId];
			if (!(id in ourPeer)) {
				const box = this.resourceManager.createBox({
					x, y, r, solver,
				});

				ourPeer[id] = box.id;
			}
		}
	}
	createMessage(frame) {
		const bodies = {};
		for (const peerId of Object.keys(this.peerBodies)) {
			const peer = this.peerBodies[peerId];
			bodies[peerId] = {};
			for (const bodyId of Object.keys(peer)) {
				bodies[peerId][bodyId] = new BodyState(
					this.solver.bodyMap[peer[bodyId]],
				);
			}
		}

		return BMSG.bytify(new Message(bodies, this.actions, frame));
	}
	gameRender(ratio) {
		for (const body of this.solver.bodies) {
			const pos = vLerp(body.originalPrevPos, body.originalPosition, ratio);
			const angle = aLerp(body.prevAngle, body.transform.radians, ratio);
			for (const shape of body.shapes) {
				if (shape.renderable) {
					shape.renderable.x = pos.x;
					shape.renderable.y = pos.y;
					shape.renderable.r = angle;
				}
			}
		}

		this.renderer.render(this.camera, this.scene);
	}
	animLoop(stamp) {
		requestAnimationFrame(this.animLoop);

		//catch up if necessary
		this.stepLoop(stamp);

		//render
		this.gameRender(this.acc / physTarget);
	}
	stepLoop(stamp = performance.now()) {
		this.acc += (stamp - this.timestamp) / 1000;
		this.timestamp = stamp;

		let steps = Math.floor(this.acc / physTarget);
		if (steps > 0) this.acc -= steps * physTarget;
		steps = Math.min(steps, maxSteps);

		for (let i = 0; i < steps; i++) {
			const solver = this.storedFrame;
			const frameId = this.currentFrame - this.storedFrameOffset;

			this.performActions(solver, this.actions[frameId]);
			this.resolveFrame(solver, this.packets[frameId]);
			if (this.storedFrameOffset < frameBufferSize) {
				this.storedFrame = fork(solver);
				solver.solve(physTarget);
			} else {
				solver.solve(physTarget);
				this.storedFrame = fork(solver);
			}

			for (let j = 0; j < this.storedFrameOffset; j++) {
				solver.solve(physTarget);
			}

			if (this.storedFrameOffset < frameBufferSize) {
				this.storedFrameOffset++;
			} else {
				const idToDrop = this.currentFrame - frameBufferSize;
				delete this.packets[idToDrop];
				delete this.actions[idToDrop];
			}

			for (const body of solver.bodies) {
				for (const shape of body.shapes) {
					const origShape = this.solver.shapeMap[shape.id];
					if (origShape != null) {
						shape.renderable = origShape.renderable;
					}
				}
			}

			this.solver = solver;
			this.currentFrame++;

			if (this.isMaster) {
				this.props.facilitator.broadcast(
					this.createMessage(this.currentFrame),
				);
			}
		}
	}
	onKeyDown(event) {
		if (event.key === "d") {
			this.addAction();
		}
	}
	render() {
		return j({canvas: {
			style: {width: "100%", height: "100%"},
			ref: (ref) => this.canvas = ref,
		}});
	}
}

Game.propTypes = {
	facilitator: PropTypes.instanceOf(Facilitator).isRequired,
	id: PropTypes.number.isRequired,
	frameZero: PropTypes.number,
	initialFrame: PropTypes.number,
	initialTimestamp: PropTypes.number,
};

module.exports = Game;
