const BMSG = require("./bmsg");
const {TypedObject} = BMSG.typedContainers;
const {Float, Uint32, Uint64} = BMSG.types;

class Ping {
	constructor() {
		this.init(Date.now());
	}
	init(timestamp) {
		this.timestamp = timestamp;
		return this;
	}
}

BMSG.addType(({getType, bytifyCore, parseCore}) => {
	const uint64Type = getType(Uint64);

	return {
		Type: Ping,
		bytifyFunc: (value) => bytifyCore(value.timestamp, uint64Type),
		parseFunc: (state) => {
			return Object.create(Ping.prototype).init(
				parseCore(state, uint64Type),
			);
		},
	};
});

class Pong {
	constructor(ping, frameZero) {
		this.init(ping, Date.now(), frameZero);
	}
	init(ping, timestamp, frameZero) {
		this.ping = ping;
		this.timestamp = timestamp;
		this.frameZero = frameZero;
		return this;
	}
}

BMSG.addType(({concat, getType, bytifyCore, parseCore}) => {
	const uint64Type = getType(Uint64);

	return {
		Type: Pong,
		bytifyFunc: (value) => {
			return concat(
				bytifyCore(value.ping, uint64Type),
				bytifyCore(value.timestamp, uint64Type),
				bytifyCore(value.frameZero, uint64Type),
			);
		},
		parseFunc: (state) => {
			return Object.create(Pong.prototype).init(
				parseCore(state, uint64Type),
				parseCore(state, uint64Type),
				parseCore(state, uint64Type),
			);
		},
	};
});

class BodyState {
	constructor(body) {
		this.init(
			body.position.x,
			body.position.y,
			body.transform.radians,
			body.velocity.x,
			body.velocity.y,
			body.angularVelocity,
		);
	}
	init(x, y, r, vx, vy, vr) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.vx = vx;
		this.vy = vy;
		this.vr = vr;
		return this;
	}
}

BMSG.addType(({concat, getType, bytifyCore, parseCore}) => {
	const floatType = getType(Float);

	return {
		Type: BodyState,
		bytifyFunc: (value) => {
			return concat(
				bytifyCore(value.x, floatType),
				bytifyCore(value.y, floatType),
				bytifyCore(value.r, floatType),
				bytifyCore(value.vx, floatType),
				bytifyCore(value.vy, floatType),
				bytifyCore(value.vr, floatType),
			);
		},
		parseFunc: (state) => {
			return Object.create(BodyState.prototype).init(
				parseCore(state, floatType),
				parseCore(state, floatType),
				parseCore(state, floatType),
				parseCore(state, floatType),
				parseCore(state, floatType),
				parseCore(state, floatType),
			);
		},
	};
});

class CreateAction {
	constructor(id, x, y, r) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.r = r;
	}
}

BMSG.addType(({concat, getType, bytifyCore, parseCore}) => {
	const uint32Type = getType(Uint32);
	const floatType = getType(Float);

	return {
		Type: CreateAction,
		bytifyFunc: (value) => {
			return concat(
				bytifyCore(value.id, uint32Type),
				bytifyCore(value.x, floatType),
				bytifyCore(value.y, floatType),
				bytifyCore(value.r, floatType),
			);
		},
		parseFunc: (state) => {
			return new CreateAction(
				parseCore(state, uint32Type),
				parseCore(state, floatType),
				parseCore(state, floatType),
				parseCore(state, floatType),
			);
		},
	};
});

class Message {
	constructor(bodies, actions, frame) {
		this.bodies = bodies;
		this.actions = actions;
		this.frame = frame;
	}
}

BMSG.addType(({concat, getType, bytifyCore, parseCore}) => {
	const typedObjectType = getType(TypedObject);
	const uint32Type = getType(Uint32);

	return {
		Type: Message,
		bytifyFunc: (value) => {
			const bodies = new TypedObject(TypedObject, {});
			const keys = Object.keys(value.bodies);
			for (const key of keys) {
				bodies.object[key] = new TypedObject(
					BodyState,
					value.bodies[key],
				);
			}

			return concat(
				bytifyCore(bodies, typedObjectType),
				bytifyCore(value.actions),
				bytifyCore(value.frame, uint32Type),
			);
		},
		parseFunc: (state) => {
			return new Message(
				parseCore(state, typedObjectType),
				parseCore(state),
				parseCore(state, uint32Type),
			);
		},
	};
});

module.exports = {
	Ping,
	Pong,
	BodyState,
	CreateAction,
	Message,
};
