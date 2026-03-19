'use strict';

const TOK_EXP = 'tok-exp';
const TOK_COMMAND = 'tok-command';
const TOK_PUCNT = 'tok-punct';
/**
 * 
 * @param {String} str
 */
const tokenize_latex = str => {
	const tokens = [];
	let first = true;
	let i = 0;
	while (str.length > 0 && i++<100) {
		let c = str[0];
		let body;
		let type;

		do {
			if ('[]{}'.includes(c)) {
				type = TOK_PUCNT;
				body = c;
				break;
			}

			if (c == '\\') {
				type = TOK_COMMAND;
				body = str.match(/^\\(?:[a-zA-Z0-9-&*]*[a-zA-Z-&*]| )/);
				if (body == null) {
					console.error('Unable to parse expression:', str);
					// body = '\\\ ';
				}
				body = body[0];
				break;
			}

			type = TOK_EXP;
			body = str.match(/^[^\\[\]{}]+/);
			if (body == null) {
				console.error('Unable to parse expression:', str);
			}
			body = body[0];
			break;
		} while (0);

		str = str.slice(body.length);
		tokens.push({type, body});
	}

	return tokens;
}

const latex_to_terms = (tokens, i) => {
	const terms = [];
	let depth = 0;
	for (i ??= 0; i < tokens.length; i++) {
		const tok = tokens[i];
		if (tok.type == TOK_EXP) {
			terms.push(tok.body);
			continue;
		}
		if (tok.type == TOK_PUCNT) {
			if ('([{'.includes(tok.body)) {
				depth++;
			} else {
				depth--;
			}

			if (depth < 0) {
				break;
			}

			terms.push({
				'{': '(',
				'}': ')',
				'[': '(',
				']': ')',
				'(': '(',
				')': ')',
			}[tok.body]);
			continue;
		}

		// tok.type == TOK_COMMAND
		switch (tok.body) {
			// TODO: programmatically add cases
			case '\\pi': {
				terms.push('pi');
			} break;

			// \sqrt[3n]{2}
			case '\\sqrt': {
				let arg1 = 2;
				let arg2 = 0;
				i++;
				if (tokens[i].body == '[') {
					const ret = latex_to_terms(tokens, ++i);
					arg1 = ret[0];
					i = ret[1]+1;
				}
				const ret = latex_to_terms(tokens, ++i);
				arg2 = ret[0];
				i = ret[1];
				terms.push(['root(', arg2, ',', arg1, ')']);
			} break;

			// \frac{a}{b}
			case '\\frac': {
				let arg1;
				let arg2;
				i += 2;
				let ret = latex_to_terms(tokens, i);
				arg1 = ret[0];
				i = ret[1] + 2;
				ret = latex_to_terms(tokens, i);
				arg2 = ret[0];
				i = ret[1];
				terms.push(['((', arg1, ')/(', arg2, '))']);
			} break;

			// TODO: allow for more generic LHS (i.e. \sum_{a_0=1}^{20}a_0)
			// \sum _ {n=1} ^5n
			// \sum _ {n=1} ^ {20} n
			case '\\sum': {
				i += 3;
				let ret = latex_to_terms(tokens, i);
				const subscript = flatten(ret[0]);
				i = ret[1] + 1;
				let supscript;
				let body;
				if (tokens[i].body == '^') {
					i += 2;
					ret = latex_to_terms(tokens, i);
					supscript = ret[0];
					i = ret[1]+1;
					ret = latex_to_terms(tokens, i);
					body = flatten(ret[0]);
					i = ret[1];
				} else {
					ret = latex_to_terms(tokens, i);
					let exp = flatten(ret[0]);
					supscript = exp[1];
					body = exp.slice(2);
					i = ret[1];
				}

				let index_var = subscript.split('=')[0];
				let lower = subscript.split('=')[1];
				let upper = supscript;
				terms.push(`sum((${body}), (${lower}), (${upper}), ${index_var})`);
			} break;

			// \operatorname{to}
			case '\\operatorname': {
				i++;
				const ret = latex_to_terms(tokens, ++i);
				terms.push(ret[0]);
				i = ret[1];
			} break;

			case '\\left':
			case '\\right': break;

			default: {
				terms.push(tok.body.slice(1));
			}
		}
	}

	return [terms, i];
}

const flatten = arr => {
	let str = '';
	arr.forEach(x => {
		if (x instanceof Array) {
			str += flatten(x);
		} else {
			str += x
		}
		str += ' '
	});

	return str.trim();
}

/**
 * 
 * @param {String} str 
 */
const parse_latex = str => {
	const tokens = tokenize_latex(str);
	const terms = latex_to_terms(tokens)[0];

	return flatten(terms);
}