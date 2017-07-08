const {j, Controller, PropTypes: {required}} = require("jenny-js");
const {randomInt64, getQueries} = require("../common/util");
const Facilitator = require("../common/rtc-facilitator");
const Game = require("./game");

class PhysicsApp extends Controller {
	init() {
		return j({div: {ref: (ref) => this.page = ref}}, [
			"WIP: coming soon",
		]);
	}
	didMount() {
		this.facilitator = new Facilitator();
		this.facilitator.onConnect(this.onConnect.bind(this));
		// this.facilitator.onData(this.receive.bind(this));
		// this.facilitator.onError(this.onError.bind(this));
		// const queries = getQueries();
		// if (queries.roomId) {
		// 	this.join(queries.roomId);
		// } else {
		// 	this.create();
		// }
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
				j(),
			];
			this.connected = true;
		}
	}
}

document.body.content = [
	j([PhysicsApp]),
];
