const {Component} = require("react");
const j = require("react-jenny");
const {
	Renderer,
	Scene,
	rgba,
	builtIn: {
		Shape,
		OrthoCamera,
		VectorMaterial,
		SpriteMaterial,
	},
} = require("2d-gl");
const {
	Math: {Vector2D},
	Solver,
	Body,
	AABB,
	Shapes: {Polygon, Circle},
} = require("boxjs");
const {getGetVisibleFunc, vlerp, alerp} = require("./render-utils");

const physTarget = 1 / 45;
const maxSteps = 5;

class Game extends Component {
	componentDidMount() {
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
		this.scene.getVisibleFunc = getGetVisibleFunc(
			() => this.solver,
			() => this.scene,
		);

		this.acc = 0;
		this.timestamp = 0;
		window.requestAnimationFrame((x) => this.step(x));
	}
	renderScene(ratio) {
		for (const body of this.solver.bodies) {
			const pos = vlerp(body.originalPrevPos, body.originalPosition, ratio);
			const angle = alerp(body.prevAngle, body.transform.radians, ratio);
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
	step(stamp) {
		window.requestAnimationFrame((x) => this.step(x));
		this.acc += (stamp - this.timestamp) / 1000 || 0;
		this.timestamp = stamp;

		let steps = Math.floor(this.acc / physTarget);
		if (steps > 0) this.acc -= steps * physTarget;
		steps = Math.min(steps, maxSteps);

		for (let i = 0; i < steps; i++) {
			this.solver.solve(physTarget);
		}

		this.renderScene(this.acc / physTarget);
	}
	render() {
		return j({canvas: {
			style: {width: "100%", height: "100%"},
			ref: (ref) => this.canvas = ref,
		}});
	}
}

module.exports = Game;
