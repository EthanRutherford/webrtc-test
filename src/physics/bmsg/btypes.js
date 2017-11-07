// javascript has no differentiation between number types.
// as such, these all behave the same way, but have different
// names to allow them to serialize/deserialize efficiently

module.exports = {
	Uint8: class extends Number {},
	Uint16: class extends Number {},
	Uint32: class extends Number {},
	Uint64: class extends Number {},
	Int8: class extends Number {},
	Int16: class extends Number {},
	Int32: class extends Number {},
	Int64: class extends Number {},
	Float: class extends Number {},
	Double: class extends Number {},
};
