/* eslint-disable no-console */
const {j, Controller, PropTypes: {required}} = require("jenny-js");
const Peer = require("./simple-peer.min.js");

function randomInt64(digits) {
	const codes =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
	let string = "";
	for (let x = 0; x < digits; x++) {
		string += codes[Math.floor(Math.random() * codes.length)];
	}
	return string;
}

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
		const id = randomInt64(6);
		const wsUrl = `wss://flixync.rserver.us/signal/initiator/${id}`;
		const signaller = new WebSocket(wsUrl);
		signaller.onmessage = (message) => {
			if (message.data === "ready") {
				this.createPeer(signaller, true);
			}
		};
		this.page.content = [
			id,
			j({br: 0}),
			j({br: 0}),
			j({div: 0}, ["send the above string to someone else to connect"]),
		];
	}
	join(data) {
		const id = data;
		const wsUrl = `wss://flixync.rserver.us/signal/receptor/${id}`;
		const signaller = new WebSocket(wsUrl);
		signaller.onmessage = (message) => {
			if (message.data === "ready") {
				this.createPeer(signaller, false);
			}
		};
		this.page.content = [
			j({div: 0}, ["waiting for connection..."]),
		];
	}
	createPeer(signaller, initiator) {
		this.peer = new Peer({initiator});

		this.peer.on("signal", (data) => {
			signaller.send(JSON.stringify(data));
		});
		signaller.onmessage = (message) => {
			this.peer.signal(JSON.parse(message.data));
		};
		this.peer.on("error", (error) => this.onError(error));

		this.peer.on("connect", () => {
			signaller.close();
			this.onConnect();
		});
	}
	onConnect() {
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
	onError(error) {
		this.page.append(`error: ${error}`);
		this.page.append(j({br: 0}));
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
		console.log("beginning local test");
		const peer1 = new Peer({initiator: true});
		const peer2 = new Peer();
		peer1.on("error", (error) => this.onError(error));
		peer2.on("error", (error) => this.onError(error));

		peer1.on("signal", (data) => {
			if (data.sdp) {
				const lines = data.sdp.split("\r\n").filter((line) => !line.includes("host"));
				data.sdp = lines.join("\r\n");
				console.log(`peer1:\n\n${data.sdp}\n`);
			} else {
				if (data.candidate && data.candidate.candidate.includes("host")) {
					return;
				}
				console.log(`peer1:\n\n${data.candidate.candidate}\n\n`);
			}
			peer2.signal(data);
		});
		peer2.on("signal", (data) => {
			if (data.sdp) {
				const lines = data.sdp.split("\r\n").filter((line) => !line.includes("host"));
				data.sdp = lines.join("\r\n");
				console.log(`peer2:\n\n${data.sdp}\n`);
			} else {
				if (data.candidate && data.candidate.candidate.includes("host")) {
					return;
				}
				console.log(`peer2:\n\n${data.candidate.candidate}\n\n`);
			}
			peer1.signal(data);
		});

		peer1.on("connect", () => peer1.send("message from peer 1"));
		peer2.on("data", (data) => {
			this.page.append("peer 2 received message: " + data);
			this.page.append(j({br: 0}));
			console.log("success!");
		});
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
