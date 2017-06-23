const {j, Controller, PropTypes: {required}} = require("jenny-js");
// const {} = require("boxjs");

module.exports = class Game extends Controller {
	init() {
		return j({canvas: {ref: (ref) => this.canvas = ref}});
	}
	didMount() {

	}
};
