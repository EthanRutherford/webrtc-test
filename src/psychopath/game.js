const {j, Controller, PropTypes: {required}} = require("jenny-js");
const Facilitator = require("../common/rtc-facilitator");

class Game extends Controller {
	init() {
		return j({div: 0}, [
			"game started woot",
		]);
	}
	didMount() {
		this.props.facilitator.onData(this.onData.bind(this));
	}
	onData(data, peer, id) {
		console.log(data);
	}
}

Game.propTypes = {
	facilitator: required(Facilitator),
	playerName: required(String),
};

module.exports = Game;
