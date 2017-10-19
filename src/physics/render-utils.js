const {Math: {Vector2D}, AABB} = require("boxjs");

const getGetVisibleFunc = (getSolver, getScene) => ({x0, y0, x1, y1}) => {
	const solver = getSolver();
	const scene = getScene();

	const visible = [];

	solver.query(new AABB(x0, y0, x1, y1), (shape) => {
		if (scene.has(shape.renderable)) {
			visible.push(shape.renderable);
		}
	});

	return visible;
};

function lerp(a, b, ratio) {
	return (a * (1 - ratio)) + (b * ratio);
}
function vlerp(a, b, ratio) {
	return new Vector2D(lerp(a.x, b.x, ratio), lerp(a.y, b.y, ratio));
}
function alerp(a, b, ratio) {
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
	getGetVisibleFunc,
	vlerp,
	alerp,
};
