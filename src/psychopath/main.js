/* global preload */
const {Component} = require("react");
const PropTypes = require("prop-types");
const {render} = require("react-dom");
const j = require("react-jenny");
preload.onCss(require("../common/css-loader"));
const {randomInt64, getQueries, throttle} = require("../common/util");
const Facilitator = require("../common/rtc-facilitator");
const Game = require("./game");
const Doodle = require("./doodle");
const styles = require("./styles.css");

class PsychopathApp extends Component {
	constructor(...args) {
		super(...args);

		this.onConnect = this.onConnect.bind(this);
		this.onConnect = this.onData.bind(this);

		this.facilitator = new Facilitator();
		this.facilitator.onConnect(this.onConnect);
		this.facilitator.onData(this.onData);

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
	onConnect(peer) {
		this.setState({
			connected: true,
			players: Object.values(this.facilitator.peers),
		});

		if (this.playerName || this.playerDoodle) {
			peer.send(JSON.stringify({
				setName: this.playerName,
				setDoodle: this.playerDoodle,
			}));
		}
	}
	onData(data, peer) {
		const message = JSON.parse(data);
		if (message.setName != null) {
			peer.playerName = message.setName;
			this.setState({
				players: Object.values(this.facilitator.peers),
			});
		}
		if (message.setDoodle != null) {
			peer.playerDoodle = message.setDoodle;
			this.setState({
				players: Object.values(this.facilitator.peers),
			});
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
		this.setState({
			players: Object.values(this.facilitator.peers),
		});
	}
	changeName(name) {
		this.playerName = name;
		this.facilitator.broadcast(JSON.stringify({
			setName: this.playerName,
		}));
		this.setState({
			players: Object.values(this.facilitator.peers),
		});
	}
	startGame(initiator) {
		this.setState({playing: true});
		this.facilitator.offData(this.onData);
		if (initiator) {
			this.facilitator.broadcast(JSON.stringify({
				startGame: true,
			}));
		}
	}
	renderPlayers() {
		return j({div: 0}, [
			j({h4: 0}, ["Players"]),
			j({div: 0}, [
				this.playerName || "(unnamed)",
				j({br: 0}),
				this.playerDoodle ? j({img: {
					className: styles.bordered,
					src: this.playerDoodle,
				}}) : null,
			]),
			...this.state.players.map((peer) => {
				const doodle = peer.playerDoodle;
				return j({div: 0}, [
					peer.playerName || "(unnamed)",
					j({br: 0}),
					doodle ? j({img: {
						className: styles.bordered,
						src: doodle,
					}}) : null,
				]);
			}),
		]);
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

		if (!this.state.playing) {
			return j({div: 0}, [
				j([Lobby, {
					changeDoodle: this.changeDoodle.bind(this),
					changeName: this.changeName.bind(this),
					id: this.facilitator.id,
					startGame: this.startGame.bind(this, true),
				}]),
				this.renderPlayers(),
			]);
		}

		return j([Game, {
			facilitator: this.facilitator,
			playerName: this.playerName,
			playerDoodle: this.playerDoodle,
		}]);
	}
}

class Lobby extends Component {
	onChange(event) {
		this.props.changeName(event.target.value);
	}
	render() {
		return j({div: 0}, [
			j({input: {
				placeholder: "your name",
				onInput: this.onChange.bind(this),
			}}),
			j([Doodle, {id: this.props.id, onChange: throttle(this.props.changeDoodle, 50)}]),
			j({br: 0}),
			j({button: {onClick: this.props.startGame}}, ["close lobby and begin"]),
		]);
	}
}

Lobby.propTypes = {
	changeDoodle: PropTypes.func.isRequired,
	changeName: PropTypes.func.isRequired,
	id: PropTypes.number.isRequired,
	startGame: PropTypes.func.isRequired,
};

render(j(PsychopathApp), document.getElementById("react-root"));
