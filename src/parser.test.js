'use strict';

const test_parser = () => {
	const calculate = exp => calc.calculateAndPrint(exp, 1000,
		Module.default_user_evaluation_options,
		Module.default_print_options
	);

	const parse = exp => calculate(parse_latex(exp));

	const assert_true = x => {
		if (!x) {
			throw new Error("Assertion Failed");
		}
	}

	assert_true(
		parse('\\sum_{n=\\sum_{j=1}^{10}j}^{100}n')
		== calculate('sum(n, sum(j, 1, 10, j), 100, n)')
	);

	assert_true(
		parse('g_0\\operatorname{to}\\frac{\\operatorname{ft}}{s^2}')
		== calculate('g_0 -> ft/s^2')
	);

	assert_true(parse('\\sqrt{2}') == calculate('sqrt 2'));
	assert_true(parse('\\sqrt[3]{2}') == calculate('root(2,3)'));
	assert_true(parse('\\frac{3x}{x}=y') == calculate('3x/x = y'));

	assert_true(
		parse('\\sum_{n=1}^{20}\\left(n+\\frac{1}{2n}\\right)')
		== calculate('sum(n+1/(2n), 1, 20, n)')
	);

	console.log('All tests passed');
}