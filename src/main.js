//# preload ./simple-peer.min.js
//# preload ./jenny.js
const Peer = require("./simple-peer.min.js");
const {j, Controller, PropTypes: {required}} = require("./jenny.js");

class TestApp extends Controller {
	init() {
		return j({div: {ref: (ref) => this.page = ref}}, [
			j([Composer, {
				create: () => this.create(),
				join: (data) => this.join(data),
				testLocal: () => this.testLocal(),
			}]),
		]);
	}
	create() {
		this.peer = new Peer({initiator: true, trickle: false});

		this.peer.on("signal", (data) => {
			this.page.content = [
				JSON.stringify(data),
				j({br: 0}),
				j({br: 0}),
				j({div: 0}, ["send the above string to someone else to connect"]),
				j({div: 0}, ["then paste their response in the box below"]),
				j({textarea: {ref: (ref) => this.text = ref}}),
				j({br: 0}),
				j({button: {
					onclick: () => this.peer.signal(JSON.parse(this.text.value))},
				}, ["connect"]),
			];
		});

		this.peer.on("connect", () => this.connect());
	}
	join(data) {
		this.peer = new Peer({initiator: false, trickle: false});
		this.peer.signal(JSON.parse(data));

		this.peer.on("signal", (data) => {
			this.page.content = [
				JSON.stringify(data),
				j({br: 0}),
				j({br: 0}),
				j({div: 0}, ["send the above string back to the other person"]),
			];
		});

		this.peer.on("connect", () => this.connect());
	}
	connect() {
		this.page.content = [
			"Connected!",
			j({br: 0}),
			j({br: 0}),
			j({textarea: {ref: (ref) => this.text = ref}}),
			j({br: 0}),
			j({button: {onclick: () => this.send()}}, ["send message"]),
			j({div: {ref: (ref) => this.messages = ref}}, [""]),
		];
		this.peer.on("data", (data) => this.receive(data));
	}
	send() {
		const message = this.text.value;
		this.text.value = "";
		this.peer.send(message);
		this.messages.content.push(j({hr: 0}));
		this.messages.content.push(`You: ${message}`);
	}
	receive(message) {
		this.messages.content.push(j({hr: 0}));
		this.messages.content.push(`Them: ${message}`);
	}
	//local test
	testLocal() {
		const peer1 = new Peer({initiator: true});
		const peer2 = new Peer();

		peer1.on("signal", (data) => {
			if (data.candidate && data.candidate.candidate.includes("host")) {
				return;
			}
			peer2.signal(data);
		});
		peer2.on("signal", (data) => {
			if (data.candidate && data.candidate.candidate.includes("host")) {
				return;
			}
			peer1.signal(data);
		});

		peer1.on("connect", () => peer1.send("message from peer 1"));
		peer2.on("data", (data) => console.log("peer 2 received message: " + data));
	}
}

class Composer extends Controller {
	init() {
		return j({div: {}}, [
			j({button: {onclick: this.create}}, ["create room"]),
			j({br: 0}),
			j({textarea: {ref: (ref) => this.text = ref}}),
			j({br: 0}),
			j({button: {onclick: this.join}}, ["join room"]),
			j({br: 0}),
			j({br: 0}),
			j({button: {onclick: this.props.testLocal}}, ["local test"]),
		]);
	}
	create() {
		this.props.create();
	}
	join() {
		this.props.join(this.text.value);
	}
}

Composer.propTypes = {
	create: required(Function),
	join: required(Function),
	testLocal: required(Function),
};

document.body.content = [
	j([TestApp]),
];
