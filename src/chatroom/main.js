const {j, Controller, PropTypes: {required}} = require("jenny-js");
const {randomInt64, getQueries} = require("../common/util");
const Facilitator = require("../common/rtc-facilitator");

class ChatApp extends Controller {
	init() {
		return j({div: {ref: (ref) => this.page = ref}}, [
			j([Composer, {
				create: () => this.create(),
				testLocal: () => this.testLocal(),
			}]),
		]);
	}
	didMount() {
		this.facilitator = new Facilitator();
		this.facilitator.onConnect(this.onConnect.bind(this));
		this.facilitator.onData(this.receive.bind(this));
		this.facilitator.onError(this.onError.bind(this));
		const queries = getQueries();
		if (queries.roomId) {
			this.join(queries.roomId);
		}
	}
	create() {
		this.roomId = randomInt64(6);
		this.facilitator.createRoom(this.roomId);
		this.linkUrl = location.origin + location.pathname + `?roomId=${this.roomId}`;
		this.page.content = [
			j({a: {href: this.linkUrl}}, [this.roomId]),
			j({br: 0}),
			j({br: 0}),
			j({div: 0}, ["send the above link to someone else to connect"]),
		];
	}
	join(data) {
		this.roomId = data;
		this.linkUrl = location.origin + location.pathname + `?roomId=${this.roomId}`;
		this.facilitator.joinRoom(data);
		this.page.content = [
			j({div: 0}, ["connecting to peers..."]),
		];
	}
	onConnect() {
		if (!this.connected) {
			this.page.content = [
				"Connected to room ",
				j({a: {href: this.linkUrl}}, [this.roomId]),
				"!",
				j({br: 0}),
				j({br: 0}),
				j({textarea: {ref: (ref) => this.text = ref}}),
				j({br: 0}),
				j({button: {onclick: () => this.send()}}, ["send message"]),
				j({div: {ref: (ref) => this.messages = ref}}, [""]),
			];
			this.connected = true;
		}
	}
	onError(error) {
		this.page.append(`error: ${error}`);
		this.page.append(j({br: 0}));
	}
	send() {
		const message = this.text.value;
		this.text.value = "";
		this.facilitator.broadcast(message);
		this.messages.content.push(j({hr: 0}));
		this.messages.content.push(`You: ${message}`);
	}
	receive(message, _, id) {
		this.messages.content.push(j({hr: 0}));
		this.messages.content.push(`peer${id}: ${message}`);
	}
	//local test
	testLocal() {
		this.facilitator.testLocalStun().then((data) => {
			this.page.append("peer 2 received message: " + data);
			this.page.append(j({br: 0}));
		}).catch((error) => this.onError(error));
	}
}

class Composer extends Controller {
	init() {
		return j({div: 0}, [
			j({button: {onclick: this.props.create}}, ["create room"]),
			j({br: 0}),
			j({br: 0}),
			j({button: {onclick: this.props.testLocal}}, ["local test"]),
		]);
	}
}

Composer.propTypes = {
	create: required(Function),
	testLocal: required(Function),
};

document.body.content = [
	j([ChatApp]),
];
