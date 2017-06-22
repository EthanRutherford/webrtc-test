function randomInt64(digits) {
	const codes =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
	let string = "";
	for (let x = 0; x < digits; x++) {
		string += codes[Math.floor(Math.random() * codes.length)];
	}
	return string;
}

function getQueries() {
	return location.search.substr(1).split("&").reduce((x, y) => {
		const z = y.split("=");
		return Object.assign(x, {[z[0]]: z[1]});
	}, {});
}

module.exports = {
	randomInt64,
	getQueries,
};
