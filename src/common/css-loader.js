/*/
 * Takes in a stylesheet and modifies the style names to make them unique
 * Uses a pseudo-bem naming convention to rename the classnames
 * Returns a map of camelcase names to actual selectors
/*/

//regex to find all valid css class names
const classRegex = /\.([a-z_]|-[a-z_-])[a-z\d_-]*/gi;

//transform string to camelcase
const toCamel = (string) => string.replace(/-([a-z0-9])/g,
	(match) => match[1].toUpperCase(),
).replace(/-/g, "");

function loader(sheet, url) {
	const out = {};
	const sheetIdentity =
		url.slice(url.lastIndexOf("/") + 1).split(".")[0].toLowerCase() +
		"-" + Math.random().toString(36).slice(2, 7);

	for (const [index, rule] of Object.entries(sheet.cssRules)) {
		if (!(rule instanceof CSSStyleRule)) {
			continue;
		}

		const newSelector = rule.selectorText.replace(classRegex, (match) => {
			const name = match.slice(1);
			const cssName = `${name}--${sheetIdentity}`;
			const jsName = toCamel(name);
			out[jsName] = cssName;
			return `.${cssName}`;
		});

		sheet.insertRule(`${newSelector} { ${rule.style.cssText} }`, index);
	}

	return out;
}

module.exports = loader;
