const {addType} = require("./core");

class TypedArray {
	constructor(type, array) {
		this.type = type;
		this.array = array;
	}
}

addType(({concat, getType, createLength, bytifyCore, parseCore}) => {
	return {
		Type: TypedArray,
		bytifyFunc: (value) => {
			const type = getType(value.type);

			const length = createLength(value.array.length);
			const bytified = value.array.map((x) => bytifyCore(x, type));
			return concat([type], length, ...bytified);
		},
		parseFunc: (state) => {
			const type = state.array[state.pos++];

			const length = parseCore(state);
			const array = [];
			for (let i = 0; i < length; i++) {
				array.push(parseCore(state, type));
			}

			return array;
		},
	};
});

class TypedObject {
	constructor(type, object) {
		this.type = type;
		this.object = object;
	}
}

addType(({concat, getType, createLength, bytifyCore, parseCore}) => {
	const stringType = getType(String);

	return {
		Type: TypedObject,
		bytifyFunc: (value) => {
			const type = getType(value.type);

			const keys = Object.keys(value.object);
			const length = createLength(keys.length);
			const bytified = keys.reduce((arr, key) => {
				arr.push(
					bytifyCore(key, stringType),
					bytifyCore(value.object[key], type),
				);
				return arr;
			}, []);

			return concat([type], length, ...bytified);
		},
		parseFunc: (state) => {
			const type = state.array[state.pos++];

			const length = parseCore(state);
			const object = {};
			for (let i = 0; i < length; i++) {
				object[parseCore(state, stringType)] = parseCore(state, type);
			}

			return object;
		},
	};
});

module.exports = {
	TypedArray,
	TypedObject,
};
