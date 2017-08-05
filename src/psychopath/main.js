/* global preload */
preload.onCss(require("../common/css-loader"));
const {j, Controller, PropTypes: {required}} = require("jenny-js");
const {randomInt64, getQueries, throttle} = require("../common/util");
const Facilitator = require("../common/rtc-facilitator");
const Game = require("./game");
const Doodle = require("./doodle");
const styles = require("./styles.css");

class PsychopathApp extends Controller {
	init() {
		return j({div: {ref: (ref) => this.page = ref}});
	}
	didMount() {
		this.facilitator = new Facilitator();
		this.facilitator.onConnect(this.onConnect.bind(this));
		this.facilitator.onData(this.onData.bind(this));
		// this.facilitator.onError(this.onError.bind(this));
		const queries = getQueries();
		if (queries.roomId) {
			this.join(queries.roomId);
		} else {
			this.create();
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
	onConnect(peer) {
		if (!this.connected) {
			this.page.content = [
				j([Lobby, {
					changeDoodle: this.changeDoodle.bind(this),
					changeName: this.changeName.bind(this),
					id: this.facilitator.id,
					startGame: this.startGame.bind(this, true),
				}]),
				j({div: {ref: (ref) => this.list = ref}}),
			];
			this.connected = true;
		}
		this.renderPlayers();
		if (this.playerName) {
			peer.send(JSON.stringify({
				setName: this.playerName,
			}));
		}
		if (this.playerDoodle) {
			peer.send(JSON.stringify({
				setDoodle: this.playerDoodle,
			}));
		}
	}
	onData(data, peer, id) {
		const message = JSON.parse(data);
		if (message.setName != null) {
			peer.playerName = message.setName;
			this.renderPlayers();
		}
		if (message.setDoodle != null) {
			peer.playerDoodle = message.setDoodle;
			this.renderPlayers();
		}
		if (message.startGame) {
			this.startGame(false);
		}
	}
	changeDoodle(data) {
		this.playerDoodle = data;
		this.facilitator.broadcast(JSON.stringify({
			setDoodle: this.playerDoodle,
		}));
		this.renderPlayers();
	}
	changeName(name) {
		this.playerName = name;
		this.facilitator.broadcast(JSON.stringify({
			setName: this.playerName,
		}));
		this.renderPlayers();
	}
	renderPlayers() {
		if (!this.list) return;
		const content = [j({h4: 0}, ["Players"])];
		content.push(j({div: 0}, [
			this.playerName || "(unnamed)",
			j({br: 0}),
			this.playerDoodle ? j({img: {
				class: styles.bordered,
				src: this.playerDoodle,
			}}) : null,
		]));
		for (const peerId in this.facilitator.peers) {
			const peer = this.facilitator.peers[peerId];
			const doodle = peer.playerDoodle;
			content.push(j({div: 0}, [
				peer.playerName || "(unnamed)",
				j({br: 0}),
				doodle ? j({img: {
					class: styles.bordered,
					src: doodle,
				}}) : null,
			]));
		}
		this.list.content = content;
	}
	startGame(initiator) {
		this.page.content = [
			j([Game, {
				facilitator: this.facilitator,
				playerName: this.playerName,
				playerDoodle: this.playerDoodle,
			}]),
		];
		if (initiator) {
			this.facilitator.broadcast(JSON.stringify({
				startGame: true,
			}));
		}
	}
}

class Lobby extends Controller {
	init() {
		return j({div: 0}, [
			j({input: {
				placeholder: "your name",
				oninput: this.onChange.bind(this),
				ref: (ref) => this.input = ref,
			}}),
			j([Doodle, {id: this.props.id, onChange: throttle(this.props.changeDoodle, 50)}]),
			j({br: 0}),
			j({button: {onclick: this.props.startGame}}, ["close lobby and begin"]),
		]);
	}
	onChange() {
		this.props.changeName(this.input.value);
	}
}

Lobby.propTypes = {
	changeDoodle: required(Function),
	changeName: required(Function),
	id: required(Number),
	startGame: required(Function),
};

document.body.content = [
	j([PsychopathApp]),
];
