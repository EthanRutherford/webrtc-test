/* eslint-disable no-console */
const {j, Controller, PropTypes: {required}} = require("jenny-js");
const {randomInt64, getQueries} = require("../common/util");

class PhysicsApp extends Controller {
	init() {
		return j({div: {ref: (ref) => this.page = ref}}, [
			j([Composer]),
			"WIP: coming soon",
		]);
	}
	didMount() {
		const queries = getQueries();
		if (queries.roomId) {
			this.join(queries.roomId);
		}
	}
}

class Composer extends Controller {
	init() {
		return j({div: 0}, [
			j({button: {onclick: this.props.create}}, ["create room"]),
		]);
	}
}

Composer.propTypes = {
	create: required(Function),
};

document.body.content = [
	j([PhysicsApp]),
];
