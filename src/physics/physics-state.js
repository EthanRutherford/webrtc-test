const {fork} = require("boxjs");

class PhysicsState {
	constructor(solver, bodies, resourceManager) {
		this.solver = solver;
		this.bodies = bodies;
		this.resourceManager = resourceManager;
	}
	resolveFrame(packet) {
		if (packet == null) {
			return;
		}

		for (const peerId of Object.keys(packet.bodies)) {
			const peer = packet.bodies[peerId];
			if (!(peerId in this.bodies)) {
				this.bodies[peerId] = {};
			}

			const ourPeer = this.bodies[peerId];
			for (const bodyId of Object.keys(peer)) {
				const {x, y, r, vx, vy, vr} = peer[bodyId];

				if (!(bodyId in ourPeer)) {
					const box = this.resourceManager.createBox({
						x, y, r, vx, vy, vr, solver: this.solver,
					});

					ourPeer[bodyId] = box.id;
				} else {
					const body = this.solver.bodyMap[ourPeer[bodyId]];
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
	performActions(actions) {
		if (actions == null) {
			return;
		}

		for (const peerId of Object.keys(actions)) {
			const {id, x, y, r} = actions[peerId];
			if (!(peerId in this.bodies)) {
				this.bodies[peerId] = {};
			}

			const ourPeer = this.bodies[peerId];
			if (!(id in ourPeer)) {
				const box = this.resourceManager.createBox({
					x, y, r, solver: this.solver,
				});

				ourPeer[id] = box.id;
			}
		}
	}
	clone() {
		const solver = fork(this.solver);
		const bodies = {};

		for (const peerId of Object.keys(this.bodies)) {
			const oldPeer = this.bodies[peerId];
			const newPeer = bodies[peerId] = {};
			for (const bodyId of Object.keys(oldPeer)) {
				newPeer[bodyId] = oldPeer[bodyId];
			}
		}

		for (const body of solver.bodies) {
			for (const shape of body.shapes) {
				const origShape = this.solver.shapeMap[shape.id];
				shape.renderable = origShape.renderable;
			}
		}

		return new PhysicsState(
			solver,
			bodies,
			this.resourceManager,
		);
	}
}

module.exports = PhysicsState;
