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

// Ideally, non-marking operators <mo></mo> will exactly match these
const non_marking = ['\u2061', '\u2062', '\u2063', '\u2064']

// Some of these are technically not needed (sum, +-) because Qalculate! supports unicode
// But it makes programming easier (comparing to 'sum' instead of a unicode value)
const operator_map = {
	'\u00b1': '±',
	'\u2213': '∓', // NOTE: Not supported by Qalculate!
	'∑': 'sum',
	'∫': 'integrate',

	// Parser use only
	'∬': 'iint',
	'∭': 'iiint',
	// Quadruple integrals aren't included because mathfield doesn't (yet) support it
	'ⅆ': 'differential_d',
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
	'msubsup': x =>    `(${x[0]}_${x[1]}^${x[2]})`,
	'msup': x =>       `(${x[0]})^(${x[1]})`,
	'mtable': x =>     `[${x.join(',')}]`,
	'mtr': x =>        `[${x.join(',')}]`,
	'mtd': x =>        `(${x.join(',')})`,
	'munder': x =>     `${x[0]}_under_${x[1]}`,
	'munderover': x => `${x[0]}_under_${x[1]}_over_${accent_map[x[2]] ?? x[2] }`,
	'menclose': x =>   `${x}`, // Non-standard (MathML 4)
}

const traverse_term = (node, exclude) => {
	exclude ??= () => false;

	let term = '';
	const allowed = ['mrow', 'mfrac', 'msqrt', 'mroot', 'mtable', 'mi', 'mn', 'mover', 'msup', 'msubsup', 'msub', 'munder', 'munderover'];

	while (allowed.includes(node?.tagName)) {
		if (exclude(node)) { break; }
		term += traverse_mathml(node);
		node = node.nextElementSibling;
	}

	return term;
}

const traverse_integral_body = node => {
	node = node.nextElementSibling;
	let body = '';

	const is_differential_d = node => node.tagName == 'mi' && (node.textContent == 'd' || node.textContent == 'differential_d');

	while (node != null) {
		if (node.getAttribute('traversed')) {
			node = node.nextElementSibling;
			continue;
		}

		if (is_differential_d(node)) {
			// Found the 'd' of 'dx'
			node.setAttribute('traversed', true);
			node = node.nextElementSibling;

			const voi = traverse_term(node, is_differential_d);
			body = body.trim() ? body : '1';
			return { body, voi };
		}

		body += traverse_mathml(node);
		node = node.nextElementSibling;
	}

	throw new Error('Variable of integration not found. Make sure to end your integral with "d" or "DifferentialD" (Alt + d)');
}

const traverse_mathml = node => {
	if (!node || node.getAttribute('traversed')) { return ''; }
	if (node.tagName == 'mspace') { return ' '; }

	node.setAttribute('traversed', true);

	// Indefinite integral
	if (node.tagName == 'mo' && node.textContent == 'integrate') {
		const { body, voi } = traverse_integral_body(node);
		return `integrate((${body}), undefined, undefined, ${voi})`;
	}

	if (node.children.length == 0) {
		return node.textContent;
	}

	if (node.tagName == 'msubsup' && node.firstChild.tagName == 'mo') {
		const children = [...node.children].slice(1).map(x => traverse_mathml(x));
			switch (node.firstChild.textContent) {
			case 'sum': {
				const index = children[0].split('=', 2)[0];
				const start = children[0].split('=', 2)[1];
				const body = traverse_term(node.nextElementSibling);
				return `sum((${body}), (${start}), (${children[1]}), (${index}))`;
			}
			case 'integrate': {
				const start = children[0];
				const end = children[1];
				const { body, voi } = traverse_integral_body(node);
				return `integrate((${body}), (${start}), (${end}), ${voi})`;
			}
		}
	}

	const children = [...node.children].map(x => traverse_mathml(x));

	try {
		return tag_map[node.tagName](children);
	} catch (e) {
		if (e instanceof TypeError) { console.error(`Unknown MathML tag: ${node.tagName}`) }
		throw e;
	}
}

export const parse_mathml = mathml => {
	// Parsed DOM is unsafe and should be sanitized if ever used in the actual DOM
	if (localStorage.getItem('print_raw_mathml')) { console.log(mathml); }

	const doc = new DOMParser().parseFromString(`<mrow>${mathml}</mrow>`, 'text/xml');
	if (doc.querySelector('parsererror')) {
		console.error(doc.querySelector('parsererror'));
		throw new Error('Failed to parse MathML');
	}

	// Preprocessing
	doc.querySelectorAll('mo').forEach(x => {
		if (non_marking.includes(x.textContent)) { x.remove(); }

		const op = operator_map[x.textContent] ?? x.textContent;
		x.textContent = op;
		
		let order = null;
		if (op == 'iint') { order = 2; }
		if (op == 'iiint') { order = 3; }
		if (order == null) { return; }

		for (let k = 0; k < order; k++) {
			const i = doc.createElement('mo');
			x.insertAdjacentElement('afterend', i);
			i.textContent = 'integrate';
		}
		x.remove();
	});

	doc.querySelectorAll('mi').forEach(x => {
		x.textContent = operator_map[x.textContent] ?? x.textContent;
	});

	// Parsing
	if (localStorage.getItem('print_mathml')) { console.log(doc); }

	const ret = traverse_mathml(doc.firstChild);
	if (localStorage.getItem('print_qalc_expression')) {
		console.log(ret);
	}
	return ret;
};