const {Component} = require("react");
const PropTypes = require("prop-types");
const j = require("react-jenny");
const Facilitator = require("../common/rtc-facilitator");

class Game extends Component {
	componentDidMount() {
		this.onData = this.onData.bind(this);
		this.props.facilitator.onData(this.onData);
	}
	onData(data, peer, id) {
		console.log(data);
	}
	render() {
		return j({div: 0}, [
			"game started woot",
		]);
	}
}

Game.propTypes = {
	facilitator: PropTypes.instanceOf(Facilitator).isRequired,
	playerName: PropTypes.string.isRequired,
	playerDoodle: PropTypes.string.isRequired,
};

module.exports = Game;
