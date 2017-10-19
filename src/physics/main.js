const {Component} = require("react");
const {render} = require("react-dom");
const j = require("react-jenny");
const {randomInt64, getQueries} = require("../common/util");
const Facilitator = require("../common/rtc-facilitator");
const Game = require("./game");

class PhysicsApp extends Component {
	constructor(...args) {
		super(...args);

		this.facilitator = new Facilitator();
		this.facilitator.onConnect(this.onConnect.bind(this));
		// this.facilitator.onData(this.receive.bind(this));
		// this.facilitator.onError(this.onError.bind(this));
		const queries = getQueries();
		if (queries.roomId) {
			this.join(queries.roomId);
		} else {
			this.create();
		}

		this.state = {
			connected: false,
			isCreator: queries.roomId == null,
			playing: false,
		};
	}
	create() {
		this.roomId = randomInt64(6);
		this.facilitator.createRoom(this.roomId);
		this.linkUrl = location.origin + location.pathname + `?roomId=${this.roomId}`;
	}
	join(data) {
		this.roomId = data;
		this.linkUrl = location.origin + location.pathname + `?roomId=${this.roomId}`;
		this.facilitator.joinRoom(data);
	}
	onConnect() {
		this.setState({connected: true});
	}
	renderWaitArea() {
		if (!this.state.isCreator) {
			return j({div: 0}, [
				"connecting to peers...",
				j({br: 0}),
				this.state.error,
			]);
		}

		return j({div: 0}, [
			j({a: {href: this.linkUrl}}, [this.roomId]),
			j({br: 0}),
			j({br: 0}),
			j({div: 0}, ["send the above link to someone else to connect"]),
			j({br: 0}),
			this.state.error,
		]);
	}
	render() {
		if (!this.state.connected) {
			return this.renderWaitArea();
		}

		return j(Game);
	}
}

render(j(PhysicsApp), document.getElementById("react-root"));
