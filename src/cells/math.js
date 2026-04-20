import { set_unsaved_changes } from './saves.js';
import { greek, calc, Module } from './calculator.js'
import { parse_latex } from './parser.js'
import { focus_cell } from './cells.js'

export const MQ = MathQuill.getInterface(2);

MQ.config({
	autoCommands: 'sqrt pi theta sum nthroot infty ' + greek.join(' '),
	sumStartsWithNEquals: true,
	autoSubscriptNumerals: true,
	autoOperatorNames: 'sin cos tan arcsin arccos arctan ln log to'
});

/**
 * @param {HTMLDivElement} cell 
 */
export const create_math_cell = cell => {
	const cell_expr = cell.querySelector('.cell-expression');
	const field = MQ.MathField(cell_expr, {
		handlers: {
			upOutOf: () => focus_cell(cell.previousElementSibling, true),
			downOutOf: () => focus_cell(cell.nextElementSibling, true),
			enter: () => run_math_cell(cell),
			edit: () => { set_unsaved_changes(true); }
		}
	});
}

export const get_math_cell_value = cell => {
	return MQ(cell.querySelector('.cell-expression')).latex();
}

export const set_math_cell_content = (cell, content) => {
	MQ(cell.querySelector('.cell-expression')).latex(content);
}

/**
 * @param {HTMLDivElement} cell 
 */
export const run_math_cell = cell => {
	const cell_result = cell.querySelector('.cell-result');
	const val = get_math_cell_value(cell);
	const exp = parse_latex(val);
	if (exp == '') { return; }
	let res = calc.calculateAndPrint(exp, 1000,
		Module.default_user_evaluation_options,
		Module.default_print_options
	);
	cell_result.innerText = res;
}