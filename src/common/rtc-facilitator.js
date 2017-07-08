/* eslint-disable no-console */
const Peer = require("../common/simple-peer.min");

function acceptPeer(data) {
	if (!this.peers[data.id]) {
		console.log(`negotiating connection with peer${data.id}`);
		createPeer.call(this, data.id, false);
	}
	this.peers[data.id].signal(data.data);
}

function createPeer(id, initiator) {
	this.peers[id] = new Peer({initiator});

	this.peers[id].on("signal", (data) => {
		this.signaller.send(JSON.stringify({id, data}));
	});

	this.peers[id].on("close", () => {
		console.log(`connection with peer${id} lost`);
		this.peers[id].destroy();
		delete this.peers[id];
		if (this._handlers.onClose instanceof Function) {
			this._handlers.onClose(id);
		}
	});

	this.peers[id].on("error", (error) => {
		console.log(error);
		this.peers[id].destroy();
		delete this.peers[id];
		if (this._handlers.onError instanceof Function) {
			this._handlers.onError(error, id);
		}
	});

	this.peers[id].on("connect", () => onConnect.call(this, id));

	//WORKAROUND_HACK: https://github.com/feross/simple-peer/issues/178
	const WORKAROUND_HACK = (data) => {
		onConnect.call(this, id);
		onData.call(this, data, id);
	};
	this.peers[id].once("connect", () => this.peers[id].removeListener("data", WORKAROUND_HACK));
	this.peers[id].once("data", WORKAROUND_HACK);
}

function onConnect(id) {
	console.log(`connection with peer${id} succeeded`);
	if (!this.peers[id].hasBeenConnected) {
		this.peers[id].on("data", (data) => onData.call(this, data, id));
		this.peers[id].hasBeenConnected = true;

		//WORKAROUND_HACK: send a few heartbeats
		for (let x = 0; x < 20; x++) {
			setTimeout(() => this.peers[id].send("\u200B"), x * 100);
		}
	}
	if (this._handlers.onConnect instanceof Function) {
		this._handlers.onConnect(this.peers[id], id);
	}
}

function onData(data, id) {
	//WORKAROUND_HACK: ignore heartbeats
	if (data + "" === "\u200B") return;
	if (this._handlers.onData instanceof Function) {
		this._handlers.onData(data, this.peers[id], id);
	}
}

module.exports = class RTCFacilitator {
	constructor() {
		this.peers = {};
		this._handlers = {
			onConnect: () => {},
			onClose: () => {},
			onData: () => {},
			onError: () => {},
		};
	}
	createRoom(roomId) {
		const wsUrl = `wss://flixync.rserver.us/signal/initiator/${roomId}`;
		this.signaller = new WebSocket(wsUrl);
		this.signaller.onmessage = (message) => {
			const data = JSON.parse(message.data);
			acceptPeer.call(this, data);
		};
	}
	joinRoom(roomId) {
		const wsUrl = `wss://flixync.rserver.us/signal/receptor/${roomId}`;
		this.signaller = new WebSocket(wsUrl);
		this.signaller.onmessage = (message) => {
			const data = JSON.parse(message.data);
			if (data.clients) {
				for (const client of data.clients) {
					console.log(`creating connection with peer${client}`);
					createPeer.call(this, client, true);
				}
			} else {
				acceptPeer.call(this, data);
			}
		};
	}
	closeRoom() {
		this.signaller.close();
	}
	broadcast(data) {
		for (const id in this.peers) {
			this.peers[id].send(data);
		}
	}
	onConnect(handler) {
		this._handlers.onConnect = handler;
	}
	onClose(handler) {
		this._handlers.onClose = handler;
	}
	onData(handler) {
		this._handlers.onData = handler;
	}
	onError(handler) {
		this._handlers.onError = handler;
	}
	//local test
	testLocalStun() {
		return new Promise((resolve, reject) => {
			console.log("beginning local stun test");
			const peer1 = new Peer({initiator: true});
			const peer2 = new Peer();
			peer1.on("error", (error) => reject(error));
			peer2.on("error", (error) => reject(error));

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
				resolve(data);
				console.log("success!");
				peer1.destroy();
				peer2.destroy();
			});
		});
	}
};
