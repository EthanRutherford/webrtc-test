const btypes = require("./btypes");

const stringEncoder = new TextEncoder("utf-8");
const stringDecoder = new TextDecoder("utf-8");

let nextTypeId = 15;
const types = {
	null: 0,
	bool: 1, boolean: 1, //alias boolean => bool
	uint8: 2,
	uint16: 3,
	uint32: 4,
	uint64: 5,
	int8: 6,
	int16: 7,
	int32: 8,
	int64: 9,
	float: 10,
	double: 11, number: 11, //alias number => double
	string: 12,
	array: 13,
	object: 14,
};

function getType(constructor) {
	const typename = constructor.name.toLowerCase();
	if (!(typename in types)) {
		return types.object;
	}

	return types[typename];
}

function getTypeFromValue(value) {
	if (value == null) {
		return types.null;
	}

	return getType(value.constructor);
}

function concat(...args) {
	const length = args.reduce((acc, arg) => acc + arg.length, 0);
	const array = new Uint8Array(length);
	let offset = 0;
	for (const arg of args) {
		array.set(arg, offset);
		offset += arg.length;
	}

	return array;
}

const _2pow8 = 2 ** 8;
const _2pow16 = 2 ** 16;
const _2pow32 = 2 ** 32;

const bytifyFuncs = {
	[types.null]: () => new Uint8Array(0),
	[types.bool]: (bool) => new Uint8Array([bool]),
	[types.uint8]: (uint8) => new Uint8Array([uint8]),
	[types.uint16]: (uint16) => {
		const buffer = new ArrayBuffer(2);
		const dataView = new DataView(buffer);

		dataView.setUint16(0, uint16);

		return new Uint8Array(buffer);
	},
	[types.uint32]: (uint32) => {
		const buffer = new ArrayBuffer(4);
		const dataView = new DataView(buffer);

		dataView.setUint32(0, uint32);

		return new Uint8Array(buffer);
	},
	[types.uint64]: (uint64) => {
		const buffer = new ArrayBuffer(8);
		const dataView = new DataView(buffer);

		dataView.setUint32(0, uint64 / _2pow32 | 0);
		dataView.setUint32(4, uint64 % _2pow32 | 0);

		return new Uint8Array(buffer);
	},
	[types.int8]: (int8) => {
		const buffer = new ArrayBuffer(1);
		const dataView = new DataView(buffer);

		dataView.setInt8(0, int8);

		return new Uint8Array(buffer);
	},
	[types.int16]: (int16) => {
		const buffer = new ArrayBuffer(2);
		const dataView = new DataView(buffer);

		dataView.setInt16(0, int16);

		return new Uint8Array(buffer);
	},
	[types.int32]: (int32) => {
		const buffer = new ArrayBuffer(4);
		const dataView = new DataView(buffer);

		dataView.setInt32(0, int32);

		return new Uint8Array(buffer);
	},
	[types.int64]: (int64) => {
		const buffer = new ArrayBuffer(8);
		const dataView = new DataView(buffer);

		const sign = int64 < 0 ? -1 : 1;
		if (sign < 0) {
			int64 = -int64;
		}

		dataView.setInt32(0, sign * int64 / _2pow32 | 0);
		dataView.setUint32(4, int64 % _2pow32 | 0);

		return new Uint8Array(buffer);
	},
	[types.float]: (float) => {
		const buffer = new ArrayBuffer(4);
		const dataView = new DataView(buffer);

		dataView.setFloat32(0, float);

		return new Uint8Array(buffer);
	},
	[types.double]: (double) => {
		const buffer = new ArrayBuffer(8);
		const dataView = new DataView(buffer);

		dataView.setFloat64(0, double);

		return new Uint8Array(buffer);
	},
	[types.string]: (string) => {
		const array = stringEncoder.encode(string);
		const length = createLength(array.length);

		return concat(length, array);
	},
	[types.array]: (array) => {
		const length = createLength(array.length);
		const bytified = array.map((x) => bytifyCore(x));
		return concat(length, ...bytified);
	},
	[types.object]: (object) => {
		const keys = Object.keys(object);
		const length = createLength(keys.length);
		const bytified = keys.reduce((arr, key) => {
			arr.push(
				bytifyCore(key, types.string),
				bytifyCore(object[key]),
			);
			return arr;
		}, []);

		return concat(length, ...bytified);
	},
};

const parseFuncs = {
	[types.null]: () => null,
	[types.bool]: (state) => !!state.array[state.pos++],
	[types.uint8]: (state) => state.array[state.pos++],
	[types.uint16]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const number = dataView.getUint16(0);
		state.pos += 2;
		return number;
	},
	[types.uint32]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const number = dataView.getUint32(0);
		state.pos += 4;
		return number;
	},
	[types.uint64]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const high = dataView.getUint32(0) * _2pow32;
		const sign = high < 0 ? -1 : 1;
		const number = high + (sign * dataView.getUint32(4));
		state.pos += 8;
		return number;
	},
	[types.int8]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const number = dataView.getInt8(0);
		state.pos += 1;
		return number;
	},
	[types.int16]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const number = dataView.getInt16(0);
		state.pos += 2;
		return number;
	},
	[types.int32]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const number = dataView.getInt32(0);
		state.pos += 4;
		return number;
	},
	[types.int64]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const number = (dataView.getInt32(0) * _2pow32) +
			dataView.getUint32(4)
		;
		state.pos += 8;
		return number;
	},
	[types.float]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const number = dataView.getFloat32(0);
		state.pos += 4;
		return number;
	},
	[types.double]: (state) => {
		const dataView = new DataView(state.array.buffer, state.pos);
		const number = dataView.getFloat64(0);
		state.pos += 8;
		return number;
	},
	[types.string]: (state) => {
		const length = parseCore(state);
		const string = stringDecoder.decode(
			state.array.subarray(state.pos, state.pos + length),
		);

		state.pos += length;
		return string;
	},
	[types.array]: (state) => {
		const length = parseCore(state);
		const array = [];
		for (let i = 0; i < length; i++) {
			array.push(parseCore(state));
		}

		return array;
	},
	[types.object]: (state) => {
		const length = parseCore(state);
		const object = {};
		for (let i = 0; i < length; i++) {
			object[parseCore(state, types.string)] = parseCore(state);
		}

		return object;
	},
};

function createLength(length) {
	let value;
	if (length < _2pow8) {
		value = new btypes.Uint8(length);
	} else if (length < _2pow16) {
		value = new btypes.Uint16(length);
	} else if (length < _2pow32) {
		value = new btypes.Uint32(length);
	} else {
		// a length of > 4 billion? if you say so.
		value = new btypes.Uint64(length);
	}

	return bytifyCore(value);
}

function bytifyCore(value, type) {
	if (type == null) {
		type = getTypeFromValue(value);
		const data = bytifyFuncs[type](value);
		const array = new Uint8Array(data.length + 1);
		array[0] = type;
		array.set(data, 1);
		return array;
	}

	return bytifyFuncs[type](value);
}

function bytify(value) {
	return bytifyCore(value);
}

function parseCore(state, type) {
	if (type == null) {
		type = state.array[state.pos++];
	}

	return parseFuncs[type](state);
}

function parse(array) {
	const state = {array, pos: 0};
	return parseCore(state);
}

const API = Object.freeze({
	concat,
	getType,
	getTypeFromValue,
	createLength,
	bytifyCore,
	parseCore,
});

function addType(initFunc) {
	const {Type, bytifyFunc, parseFunc} = initFunc(API);

	const typeId = nextTypeId++;
	types[Type.name.toLowerCase()] = typeId;
	bytifyFuncs[typeId] = bytifyFunc;
	parseFuncs[typeId] = parseFunc;
}

module.exports = {
	bytify,
	parse,
	addType,
};
