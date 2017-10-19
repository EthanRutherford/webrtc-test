const {Component} = require("react");
const j = require("react-jenny");
const {} = require("boxjs");

module.exports = class Game extends Component {
	render() {
		return j({canvas: {ref: (ref) => this.canvas = ref}});
	}
};
