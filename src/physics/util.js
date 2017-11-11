const {Math: {Vector2D}, AABB} = require("boxjs");

const physTarget = 1 / 30;
const maxSteps = 100;

const getGetVisibleFunc = (game) => ({x0, y0, x1, y1}) => {
	const {physicsState, scene} = game;
	const visible = [];

	physicsState.solver.query(new AABB(x0, y0, x1, y1), (shape) => {
		if (scene.has(shape.renderable)) {
			visible.push(shape.renderable);
		}
	});

	return visible;
};

function lerp(a, b, ratio) {
	return (a * (1 - ratio)) + (b * ratio);
}
function vLerp(a, b, ratio) {
	return new Vector2D(lerp(a.x, b.x, ratio), lerp(a.y, b.y, ratio));
}
function aLerp(a, b, ratio) {
	const diff = Math.abs(a - b);
	if (diff > Math.PI) {
		if (a > b) {
			b += 2 * Math.PI;
		} else {
			a += 2 * Math.PI;
		}
	}
	return lerp(a, b, ratio);
}

module.exports = {
	physTarget,
	maxSteps,
	getGetVisibleFunc,
	lerp,
	vLerp,
	aLerp,
};
