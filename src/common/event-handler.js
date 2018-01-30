module.exports = class EventHandler {
	constructor() {
		this.handlers = new Set();
	}
	add(method) {
		this.handlers.add(method);
	}
	delete(method) {
		this.handlers.delete(method);
	}
	trigger(...args) {
		for (const handler of this.handlers) {
			handler(...args);
		}
	}
};
