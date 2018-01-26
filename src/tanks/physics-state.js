const {fork} = require("boxjs");

class PhysicsState {
	constructor(solver, bodies, resourceManager) {
		this.solver = solver;
		this.bodies = bodies;
		this.resourceManager = resourceManager;
		this.tanks = {};
	}
	resolveFrame(packet) {
		if (packet == null) {
			return;
		}

		for (const bodyId of Object.keys(packet.bodies)) {
			const {x, y, r, vx, vy, vr} = packet.bodies[bodyId];

			if (!(bodyId in this.bodies)) {
				const box = this.resourceManager.createBox({
					x, y, r, vx, vy, vr, solver: this.solver,
				});

				this.bodies[bodyId] = box.id;
			} else {
				const body = this.solver.bodyMap[this.bodies[bodyId]];
				body.position.x = x;
				body.position.y = y;
				body.transform.radians = r;
				body.velocity.x = vx;
				body.velocity.y = vy;
				body.angularVelocity = vr;
			}
		}
	}
	performActions(actions) {
		if (actions == null) {
			return;
		}

		for (const peerId of Object.keys(actions)) {
			;
		}
	}
	clone() {
		const solver = fork(this.solver);
		const bodies = {};

		for (const bodyId of Object.keys(this.bodies)) {
			bodies[bodyId] = this.bodies[bodyId];
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
