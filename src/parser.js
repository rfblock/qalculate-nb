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
	'munder': x =>     { throw new Error("Not Implemented"); },
	'munderover': x => { throw new Error("Not Implemented"); },
}

const traverse_mathml = node => {
	if (node.tagName == 'mspace') { return ' '; }

	if (node.children.length == 0) {
		return non_marking.includes(node.textContent) ? '' : node.textContent;
	}

	const children = [...node.children];
	try {
		return tag_map[node.tagName](children.map(x => traverse_mathml(x)));
	} catch (e) {
		if (e instanceof TypeError) { console.error(`Unknown MathML tag: ${node.tagName}`) }
		throw e;
	}
}

export const parse_mathml = mathml => {
	// Parsed DOM is unsafe and should be sanitized if ever used in the actual DOM
	const doc = new DOMParser().parseFromString(`<mrow>${mathml}</mrow>`, 'text/xml');
	console.log(doc);
	if (doc.querySelector('parsererror')) {
		console.error(doc.querySelector('parsererror'));
		throw new Error('Failed to parse MathML');
	}

	return traverse_mathml(doc.firstChild);
};