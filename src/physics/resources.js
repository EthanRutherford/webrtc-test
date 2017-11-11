const {
	Math: {Vector2D},
	Body,
	Shapes: {Polygon},
} = require("boxjs");
const {
	rgba,
	builtIn: {
		Shape,
		VectorMaterial,
	},
} = require("2d-gl");

// some colors
const yellow = rgba(1, 1, 0, 1);
const cyan = rgba(0, 1, 1, 1);

// some shapes and materials
const groundShape = new Shape(
	new Polygon().setAsBox(10, .5).originalPoints,
);
const yellowRect = new VectorMaterial(
	[yellow, yellow, yellow, yellow],
);

const boxShape = new Shape(
	new Polygon().setAsBox(.5, .5).originalPoints,
);
const cyanRect = new VectorMaterial(
	[cyan, cyan, cyan, cyan],
);

class ResourceManager {
	constructor(renderer, scene) {
		this.renderer = renderer;
		this.scene = scene;
	}
	createBody(params, shape, material, solver) {
		const renderable = this.renderer.getInstance(shape, material);
		const body = new Body(params);

		solver.addBody(body);
		body.shapes[0].renderable = renderable;
		this.scene.add(renderable);

		return body;
	}
	createGround(solver) {
		return this.createBody({
			position: new Vector2D(0, 0),
			shapes: [new Polygon().setAsBox(10, .5)],
			static: true,
		}, groundShape, yellowRect, solver);
	}
	createBox({x, y, r, vx = 0, vy = 0, vr = 0, solver}) {
		return this.createBody({
			position: new Vector2D(x, y),
			angle: r,
			velocity: new Vector2D(vx, vy, vr),
			angularVelocity: vr,
			shapes: [new Polygon().setAsBox(.5, .5)],
		}, boxShape, cyanRect, solver);
	}
}

module.exports = {
	ResourceManager,
	shapes: {groundShape, boxShape},
	materials: {yellowRect, cyanRect},
};
