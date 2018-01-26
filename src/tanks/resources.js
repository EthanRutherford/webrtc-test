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
const {seed, generate} = require("./maze");

// some colors
const white = rgba(1, 1, 1, 1);
const cyan = rgba(0, 1, 1, 1);

// maze shapes and materials
const wallShape = new Shape(
	new Polygon().setAsBox(1.1, .1).originalPoints,
);
const wallMaterial = new VectorMaterial(
	[white, white, white, white],
);

// some shapes and materials
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
	spawnTank(x, y, solver) {
		return this.createBody({
			position: new Vector2D(x, y),
			shapes: [new Polygon().setAsBox(.5, .5)],
		}, boxShape, cyanRect, solver);
	}
	createMazeWall(x, y, r, solver) {
		this.createBody({
			position: new Vector2D(x, y),
			angle: r,
			shapes: [new Polygon().setAsBox(1.1, .1)],
			static: true,
		}, wallShape, wallMaterial, solver);
	}
	createMaze(seedA, seedB, solver) {
		seed(seedA, seedB);
		const width = 12;
		const height = 8;
		const hw = width / 2;
		const hh = height / 2;

		const maze = generate(width, height, .3);
		for (const row of maze) {
			for (const cell of row) {
				if (cell.left === -1) {
					this.createMazeWall(
						(cell.j - hw) * 2,
						(hh - cell.i) * 2 - 1,
						Math.PI / 2,
						solver,
					);
				}
				if (cell.top === -1) {
					this.createMazeWall(
						(cell.j - hw) * 2 + 1,
						(hh - cell.i) * 2,
						0,
						solver,
					);
				}
				if (cell.right == null || cell.right === -1) {
					this.createMazeWall(
						((cell.j - hw) + 1) * 2,
						(hh - cell.i) * 2 - 1,
						Math.PI / 2,
						solver,
					);
				}
				if (cell.bottom == null || cell.bottom === -1) {
					this.createMazeWall(
						(cell.j - hw) * 2 + 1,
						((hh - cell.i) - 1) * 2,
						0,
						solver,
					);
				}
			}
		}
	}
}

module.exports = {
	ResourceManager,
	shapes: {wallShape, boxShape},
	materials: {wallMaterial, cyanRect},
};
