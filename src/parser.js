'use strict';

/*
Parser key assumptions:
 - MathML is always well formed
 - Only printed characters should be parsed (i.e. no invisible multiplication or function application)
 - Ignore styles
 - Only important tags:
   - <mi> (Identifier, such as x)
   - <mn> (Number, such as 2 or 3.7)
   - <mo> (Operator, such as +)
   - <mover> (Over-text, such as an overline or vector arrow)
   - <mroot> (n-th root)
   - <mrow> (Grouping, akin to \left and \right from LaTeX)
   - <msqrt> (Square root)
   - <msub> (Subscript)
   - <msubsup> (Subscript and Superscript, such as A_0^2 or definite integrals)
   - <msup> (Superscript)
   - <mtable> (Table, usually matrix)
   - <mtr> (Table row)
   - <mtd> (Table cell)
   - <munder> (Under-text, such as a limit)
   - <munderover> (Under/over-text, such as a sum. Note that MathLive incorrectly parses sums as subsup instead of overunder)
*/

const non_marking = ['\u2061', '\u2062', '\u2063', '\u2064']

// Some of these are technically not needed (sum) because Qalculate! supports unicode
// But it makes programming easier (comparing to 'sum' instead of a unicode value)
const operator_map = {
	'\u00b1': '±',
	'\u2213': '∓', // NOTE: Not supported by Qalculate!
	'∑': 'sum',
}

// This will be changed _eventually_, but there is currently a bug with MathField that prevents proper accents from working
const accent_map = {
	'\u20d7': 'vec',
	'\u00af': 'bar',
	'\u005e': 'hat',
}

const tag_map = {
	'mi': () => { throw new Error("Child(ren) in leaf element"); },
	'mn': () => { throw new Error("Child(ren) in leaf element"); },
	'mo': () => { throw new Error("Child(ren) in leaf element"); },
	'mfrac': x =>      `((${x[0]})/(${x[1]}))`,
	'mover': x =>      `${x[0]}_over_${accent_map[x[1]] ?? x[1] }`,
	'mroot': x =>      `root((${x[0]}), (${x[1]}))`,
	'mrow': x =>       `${x.join('')}`,
	'msqrt': x =>      `sqrt(${x[0]})`,
	'msub': x =>       `${x[0]}_${x[1]}`,
	'msubsup': x =>    `(${x[0]}_${x[1]}^${x[2]})`, // TODO: If x[0] is <mo>, parse as a function (i.e. sum)
	'msup': x =>       `(${x[0]}^${x[1]})`,
	'mtable': x =>     `[${x.join(',')}]`,
	'mtr': x =>        `[${x.join(',')}]`,
	'mtd': x =>        `(${x.join(',')})`,
	'munder': x =>     `${x[0]}_under_${x[1]}`,
	'munderover': x => `${x[0]}_under_${x[1]}_over_${accent_map[x[2]] ?? x[2] }`,
}

const traverse_mathml = node => {
	if (!node || node.getAttribute('traversed')) { return ''; }
	if (node.tagName == 'mspace') { return ' '; }

	node.setAttribute('traversed', true);
	if (node.children.length == 0) {
		return non_marking.includes(node.textContent) ? '' : (operator_map[node.textContent] ?? node.textContent);
	}

	const children = [...node.children].map(x => traverse_mathml(x));

	if (node.tagName == 'msubsup' && node.firstChild.tagName == 'mo') {
		if (children[0] == 'sum') {
			const index = children[1].split('=', 2)[0];
			const start = children[1].split('=', 2)[1];
			const body = traverse_mathml(node.nextElementSibling);
			return `sum((${body}), (${start}), (${children[2]}), (${index}))`;
		}
	}

	try {
		return tag_map[node.tagName](children);
	} catch (e) {
		if (e instanceof TypeError) { console.error(`Unknown MathML tag: ${node.tagName}`) }
		throw e;
	}
}

export const parse_mathml = mathml => {
	// Parsed DOM is unsafe and should be sanitized if ever used in the actual DOM
	const doc = new DOMParser().parseFromString(`<mrow>${mathml}</mrow>`, 'text/xml');
	if (doc.querySelector('parsererror')) {
		console.error(doc.querySelector('parsererror'));
		throw new Error('Failed to parse MathML');
	}

	return traverse_mathml(doc.firstChild);
};