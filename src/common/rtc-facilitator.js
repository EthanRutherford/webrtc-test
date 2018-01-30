/* eslint-disable no-console */
const Peer = require("./simple-peer.min");
const EventHandler = require("./event-handler");

function acceptPeer(facillitator, data) {
	if (!facillitator.peers[data.id]) {
		console.log(`negotiating connection with peer${data.id}`);
		createPeer(facillitator, data.id, false);
	}
	facillitator.peers[data.id].signal(data.data);
}

function createPeer(facillitator, id, initiator) {
	facillitator.peers[id] = new Peer({initiator});

	const timeout = setTimeout(() => {
		facillitator.peers[id].destroy();
	}, 5000);

	facillitator.peers[id].on("signal", (data) => {
		facillitator.signaller.send(JSON.stringify({id, data}));
	});

	facillitator.peers[id].on("close", () => {
		console.log(`connection with peer${id} lost`);
		facillitator.peers[id].destroy();
		delete facillitator.peers[id];
		facillitator._handlers.onClose.trigger(id);
	});

	facillitator.peers[id].on("error", (error) => {
		console.log(error);
		facillitator.peers[id].destroy();
		delete facillitator.peers[id];
		facillitator._handlers.onError.trigger(error, id);
	});

	facillitator.peers[id].on("connect", () => {
		clearTimeout(timeout);
		onConnect(facillitator, id);
	});
}

function onConnect(facillitator, id) {
	console.log(`connection with peer${id} succeeded`);
	if (!facillitator.peers[id].hasBeenConnected) {
		facillitator.peers[id].on("data", (data) => onData(facillitator, data, id));
		facillitator.peers[id].hasBeenConnected = true;
	}
	facillitator._handlers.onConnect.trigger(facillitator.peers[id], id);
}

function onData(facillitator, data, id) {
	facillitator._handlers.onData.trigger(data, facillitator.peers[id], id);
}

module.exports = class RTCFacilitator {
	constructor() {
		this.peers = {};
		this._handlers = {
			onConnect: new EventHandler(),
			onClose: new EventHandler(),
			onData: new EventHandler(),
			onError: new EventHandler(),
		};
	}
	createRoom(roomId) {
		const wsUrl = `wss://flixync.rserver.us/signal/initiator/${roomId}`;
		this.signaller = new WebSocket(wsUrl);
		this.signaller.onmessage = (message) => {
			const data = JSON.parse(message.data);
			if (data.yourId != null) {
				this.id = Number.parseInt(data.yourId, 10);
			}
			if (data.id != null && data.data != null) {
				acceptPeer(this, data);
			}
		};
	}
	joinRoom(roomId, fullyConnected = true) {
		const wsUrl = `wss://flixync.rserver.us/signal/receptor/${roomId}`;
		this.signaller = new WebSocket(wsUrl);
		this.signaller.onmessage = (message) => {
			const data = JSON.parse(message.data);
			if (data.clients != null) {
				const clients = fullyConnected ? data.clients : [0];
				for (const client of clients) {
					console.log(`creating connection with peer${client}`);
					createPeer(this, client, true);
				}
			}
			if (data.yourId != null) {
				this.id = Number.parseInt(data.yourId, 10);
			}
			if (data.id != null && data.data != null) {
				acceptPeer(this, data);
			}
		};
	}
	closeRoom() {
		this.signaller.close();
	}
	broadcast(data) {
		for (const id in this.peers) {
			const peer = this.peers[id];
			if (peer.connected) {
				peer.send(data);
			}
		}
	}
	onConnect(handler) {
		this._handlers.onConnect.add(handler);
	}
	offConnect(handler) {
		this._handlers.onConnect.delete(handler);
	}
	onClose(handler) {
		this._handlers.onClose.add(handler);
	}
	offClose(handler) {
		this._handlers.onClose.delete(handler);
	}
	onData(handler) {
		this._handlers.onData.add(handler);
	}
	offData(handler) {
		this._handlers.onData.delete(handler);
	}
	onError(handler) {
		this._handlers.onError.add(handler);
	}
	offError(handler) {
		this._handlers.onError.delete(handler);
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
