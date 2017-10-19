const {Component} = require("react");
const PropTypes = require("prop-types");
const {render} = require("react-dom");
const j = require("react-jenny");
const {randomInt64, getQueries} = require("../common/util");
const Facilitator = require("../common/rtc-facilitator");

const status = {
	disconnected: 0,
	connecting: 1,
	connected: 2,
};

class ChatApp extends Component {
	constructor(...args) {
		super(...args);

		this.facilitator = new Facilitator();
		this.facilitator.onConnect(this.onConnect.bind(this));
		this.facilitator.onData(this.receive.bind(this));
		this.facilitator.onError(this.onError.bind(this));
		const queries = getQueries();
		if (queries.roomId) {
			this.join(queries.roomId);
		}

		this.state = {
			status: queries.roomId != null ? status.connecting : status.disconnected,
			isCreator: false,
			messages: [],
		};
	}
	create() {
		this.roomId = randomInt64(6);
		this.facilitator.createRoom(this.roomId);
		this.linkUrl = location.origin + location.pathname + `?roomId=${this.roomId}`;

		this.setState({isCreator: true, status: status.connecting});
	}
	join(data) {
		this.roomId = data;
		this.linkUrl = location.origin + location.pathname + `?roomId=${this.roomId}`;
		this.facilitator.joinRoom(data);
	}
	onConnect() {
		this.setState({status: status.connected});
	}
	onError(error) {
		this.setState({error: `error: ${error}`});
	}
	send(message) {
		this.facilitator.broadcast(message);
		this.setState({
			messages: this.state.messages.concat({
				author: "You",
				text: message,
			}),
		});
	}
	receive(message, _, id) {
		this.setState({
			messages: this.state.messages.concat({
				author: `peer${id}`,
				text: message.toString(),
			}),
		});
	}
	testLocal() {
		this.facilitator.testLocalStun().then((data) =>
			this.setState({testResult: `peer 2 received: ${data}`}),
		).catch((error) =>
			this.setState({testResult: `error: ${error}`}),
		);
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
		if (this.state.status === status.disconnected) {
			return j([Composer, {
				create: () => this.create(),
				testLocal: () => this.testLocal(),
				testResult: this.state.testResult,
			}]);
		}

		if (this.state.status === status.connecting) {
			return this.renderWaitArea();
		}

		return j([Messenger, {
			linkUrl: this.linkUrl,
			messages: this.state.messages,
			roomId: this.roomId,
			send: (message) => this.send(message),
			error: this.state.error,
		}]);
	}
}

class Messenger extends Component {
	constructor(...args) {
		super(...args);

		this.state = {text: ""};
	}
	send() {
		this.props.send(this.state.text);
		this.setState({text: ""});
	}
	render() {
		return j({div: 0}, [
			"Connected to room ",
			j({a: {href: this.props.linkUrl}}, [this.props.roomId]),
			j({br: 0}),
			j({br: 0}),
			j({textarea: {
				value: this.state.text,
				onChange: (event) => this.setState({text: event.target.value}),
			}}),
			j({br: 0}),
			j({button: {onClick: () => this.send()}}, ["send message"]),
			j({div: 0}, this.props.messages.reduce(
				(arr, message) => arr.concat([
					j({hr: 0}),
					j({div: 0}, [message.author, " - ", message.text]),
				]),
				[],
			)),
			j({br: 0}),
			this.props.error,
		]);
	}
}

Messenger.propTypes = {
	error: PropTypes.string,
	linkUrl: PropTypes.string.isRequired,
	messages: PropTypes.array.isRequired,
	roomId: PropTypes.string.isRequired,
	send: PropTypes.func.isRequired,
};

class Composer extends Component {
	render() {
		return j({div: 0}, [
			j({button: {onClick: this.props.create}}, ["create room"]),
			j({br: 0}),
			j({br: 0}),
			j({button: {onClick: this.props.testLocal}}, ["local test"]),
			j({br: 0}),
			this.props.testResult,
		]);
	}
}

Composer.propTypes = {
	create: PropTypes.func.isRequired,
	testLocal: PropTypes.func.isRequired,
	testResult: PropTypes.string,
};

render(j(ChatApp), document.getElementById("react-root"));
