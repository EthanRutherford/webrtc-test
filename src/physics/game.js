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
const {Math: {Vector2D}, Solver} = require("boxjs");
const Facilitator = require("../common/rtc-facilitator");
const {
	physTarget,
	maxSteps,
	getGetVisibleFunc,
	vLerp,
	aLerp,
} = require("./util");
const {ResourceManager} = require("./resources");
const PhysicsState = require("./physics-state");
const BMSG = require("./bmsg");
const {Ping, Pong, BodyState, CreateAction, Message} = require("./serial");

const frameBufferSize = 3;

class Game extends Component {
	componentDidMount() {
		this.isMaster = this.props.id === 0;

		const solver = new Solver();
		const gravityAcceleration = new Vector2D(0, -9.8);
		solver.applyG = (bodies) => {
			for (const body of bodies) {
				body.applyForce(gravityAcceleration.times(body.mass.m));
			}
		};

		this.renderer = new Renderer(this.canvas);
		this.scene = new Scene({bgColor: rgba(.1, .1, .1, 1)});
		this.camera = new OrthoCamera(0, 0, 20);
		this.scene.getVisibleFunc = getGetVisibleFunc(this);

		const resourceManager = new ResourceManager(
			this.renderer, this.scene,
		);

		resourceManager.createGround(solver);
		this.myNextBody = 0;

		this.physicsState = new PhysicsState(solver, {}, resourceManager);
		this.storedFrame = this.physicsState.clone();
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
	createMessage(frame) {
		const bodies = {};
		for (const peerId of Object.keys(this.physicsState.bodies)) {
			const peer = this.physicsState.bodies[peerId];
			bodies[peerId] = {};
			for (const bodyId of Object.keys(peer)) {
				bodies[peerId][bodyId] = new BodyState(
					this.physicsState.solver.bodyMap[peer[bodyId]],
				);
			}
		}

		return BMSG.bytify(new Message(bodies, this.actions, frame));
	}
	gameRender(ratio) {
		for (const body of this.physicsState.solver.bodies) {
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
			const state = this.storedFrame;
			const frameId = this.currentFrame - this.storedFrameOffset;

			state.performActions(this.actions[frameId]);
			state.resolveFrame(this.packets[frameId]);
			if (this.storedFrameOffset < frameBufferSize) {
				this.storedFrame = state.clone();
				state.solver.solve(physTarget);
			} else {
				state.solver.solve(physTarget);
				this.storedFrame = state.clone();
			}

			for (let j = 0; j < this.storedFrameOffset; j++) {
				state.performActions(this.actions[frameId + j + 1]);
				state.solver.solve(physTarget);
			}

			if (this.storedFrameOffset < frameBufferSize) {
				this.storedFrameOffset++;
			} else {
				const idToDrop = this.currentFrame - frameBufferSize;
				delete this.packets[idToDrop];
				delete this.actions[idToDrop];
			}

			this.physicsState = state;
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
	frameZero: PropTypes.number,
	id: PropTypes.number.isRequired,
	initialFrame: PropTypes.number,
	initialTimestamp: PropTypes.number,
	roomId: PropTypes.string.isRequired,
};

module.exports = Game;
