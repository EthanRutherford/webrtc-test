/*/
 * Takes in a stylesheet and modifies the style names to make them unique
 * Uses a pseudo-bem naming convention to rename the classnames
 * Returns a map of camelcase names to actual selectors
/*/

//regex to find all valid css class names
const classRegex = /\.([a-z_]|-[a-z_-])[a-z\d_-]*/gi;

//transform string to camelcase
const toCamel = (string) => string.replace(/-([a-z0-9])/g,
	(match) => match[1].toUpperCase()
).replace(/-/g, "");

function loader(sheet, url) {
	const out = {};
	const name =
		url.slice(url.lastIndexOf("/") + 1).split(".")[0].toLowerCase() +
		"--" + Math.random().toString(36).slice(2, 7);
	const rules = [...sheet.cssRules].filter((rule) => rule instanceof CSSStyleRule);

	for (const rule of rules) {
		rule.selectorText = rule.selectorText.replace(classRegex, (match) => {
			const newSelector = `${name}__${match.slice(1)}`;
			const jsName = toCamel(match.slice(1));
			out[jsName] = newSelector;
			return `.${newSelector}`;
		});
	}

	return out;
}

module.exports = loader;
