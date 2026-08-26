'use strict';

import { convertLatexToMathMl } from 'https://esm.run/mathlive';
import { parse_mathml } from './parser.js';
import { calculate } from './calculator.js'

const tests = [
	['1+1', '1+1'],
	['g_0\\,to\\,\\frac{ft}{s^2}', 'g_0 -> ft/s^2'],

	['\\sqrt2', 'sqrt(2)'],
	['\\sqrt{\\sqrt3}', 'sqrt(sqrt(3))'],
	['\\sqrt[3]{\\sqrt[3]{4}}', 'root(root(4, 3), 3)'],

	['\\sin\\left(45\\,deg\\right)^2', 'sin(45 deg)^2'],
	['\\sin\\left(45\\degree\\right)^{2x}', 'sin(45 deg)^(2x)'],
	['2^{3^3}', '2^(3^3)'],

	['\\sum_{n=\\sum_{j=1}^{10}j}^{100}n', 'sum(n, sum(j, 1, 10, j), 100, n)'],
	['\\sum_{n=4}^{23}n^2', 'sum(n^2, 4, 23, n)'],
	['\\sum_{n=1}^{20}\\left(n+\\frac{1}{2n}\\right)', 'sum(n+1/2n, 1, 20, n)'],
	['\\sum_{n=16}^{53}\\sqrt{n}+1', 'sum(sqrt n, 16, 53, n) + 1'],

	['\\begin{pmatrix}0\\\\ 1\\\\ 0\\end{pmatrix}', '[0;1;0]'],
	['\\begin{pmatrix}1 & 2 & 3\\\\ 4 & 5 & 6\\\\ 7 & 8 & 9\\\\ 10 & 11 & 12\\end{pmatrix}', '[1,2,3;4,5,6;7,8,9;10,11,12]'],

	['\\int_{}^{}\\differentialD x', 'integral(1, undefined, undefined, x)'],
	['\\int_{}^{}\\sin\\left(x\\right)^2\\differentialD x', 'integral(sin(x)^2)'],
	['\\int_0^1\\sin\\left(x\\right)^2\\differentialD x', 'integral(sin(x)^2,0,1,x)'],
	['\\int_0^1\\int_0^1xy\\,\\differentialD y\\,\\differentialD x', 'integral(integral(xy, 0, 1, y), 0, 1, x)'],
	['\\int_{}^{}\\int_{}^{}xy\\,\\differentialD y\\,\\differentialD x', 'integral(integral(xy, undefined, undefined, y), undefined, undefined, x)'],
	['\\iint xy\\,\\differentialD y\\,\\differentialD x', 'integral(integral(xy, undefined, undefined, y), undefined, undefined, x)'],
	['\\iiint xyz^4\\differentialD z\\differentialD x\\differentialD y', 'integral(integral(integral(x y z^4, undefined, undefined, z), undefined, undefined, x), undefined, undefined, y)']
]

export const test_parser = () => {
	const parse = exp => calculate(parse_mathml(convertLatexToMathMl(exp)));
	let failed = 0;
	let passed = 0;

	tests.forEach((test, i) => {
		try {
			if (parse(test[0]).res != calculate(test[1]).res) {
				console.warn(`Failed test #${i}:\n  ${test[0]}\n=/=\n  ${test[1]}`)
				failed++;
				return;
			}
			passed++;
		} catch (e) {
			console.warn(`Failed test #${i} (Exception):\n  ${e.message}`);
			failed++;
		}
	});

	
	if (failed == 0) {
		console.log('All tests passed');
	} else if (failed == 1) {
		console.warn(`1 test failed / ${passed} passed`);
	} else {
		console.warn(`${failed} tests failed / ${passed} passed`);
	}
}