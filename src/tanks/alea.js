// an implementation of the alea algorithm by Johannes Baagøe
// <baagoe@baagoe.com>, 2010

const _2tn32 = 2.3283064365386963e-10; // 2^-32
const _2tn53 = 1.1102230246251565e-16; // 2^-53

function getMashFunc() {
	let n = 0xefc8249d;

	return (data) => {
		data = data.toString();
		for (let i = 0; i < data.length; i++) {
			n += data.charCodeAt(i);
			let h = 0.02519603282416938 * n;
			n = h >>> 0;
			h -= n;
			h *= n;
			n = h >>> 0;
			h -= n;
			n += h * 0x100000000;
		}

		return (n >>> 0) * _2tn32;
	};
}

class Alea extends Function {
	constructor(...seeds) {
		// init
		const internals = {};
		const mash = getMashFunc();
		internals.c = 1;
		internals.s0 = mash(" ");
		internals.s1 = mash(" ");
		internals.s2 = mash(" ");

		// seed
		for (const seed of seeds) {
			internals.s0 -= mash(seed);
			if (internals.s0 < 0) internals.s0++;
			internals.s1 -= mash(seed);
			if (internals.s1 < 0) internals.s1++;
			internals.s2 -= mash(seed);
			if (internals.s2 < 0) internals.s2++;
		}

		// create, bind, setup prototype, and return func
		const alea = Alea.alea.bind(internals);
		alea.uint32 = () => alea() * 0x100000000;
		alea.double = () => alea() + (alea() * 0x200000 | 0) * _2tn53;
		Object.setPrototypeOf(alea, Alea.prototype);

		return alea;
	}
	static alea() {
		const t = 2091639 * this.s0 + this.c * _2tn32;
		this.s0 = this.s1;
		this.s1 = this.s2;
		return this.s2 = t - (this.c = t | 0);
	}
}

module.exports = Alea;
