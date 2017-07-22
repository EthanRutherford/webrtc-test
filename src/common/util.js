const codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function randomInt64(digits) {
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

function throttle(func, minTime) {
	let lastCall = 0;
	let theArgs;

	return (...args) => {
		const timeSince = Date.now() - lastCall;
		theArgs = args;

		if (timeSince > minTime) {
			func(...theArgs);
			lastCall = Date.now();
		} else {
			setTimeout(() => {
				func(...theArgs);
				lastCall = Date.now();
			}, minTime - timeSince);
		}
	};
}

function debounce(func, waitTime) {
	let timeout;
	let theArgs;

	return (...args) => {
		theArgs = args;

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			func(...theArgs);
		}, waitTime);
	};
}

module.exports = {
	randomInt64,
	getQueries,
	throttle,
	debounce,
};
