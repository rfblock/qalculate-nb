import { set_unsaved_changes } from './saves.js';
import { greek, calculate } from './calculator.js'
import { parse_latex } from './parser.js'
import { focus_cell } from './cells.js'

export const MQ = MathQuill.getInterface(2);

let trigFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot']
let hyperbolicFunctions = trigFunctions.map(x => `${x}h`);
trigFunctions = trigFunctions.concat(trigFunctions.map(x => `arc${x}`));
hyperbolicFunctions = hyperbolicFunctions.concat(hyperbolicFunctions.map(x => `ar${x}`));
trigFunctions = trigFunctions.concat(hyperbolicFunctions);

MQ.config({
	autoCommands: 'sqrt pi theta sum nthroot infty ' + greek.join(' '),
	sumStartsWithNEquals: true,
	autoSubscriptNumerals: true,
	autoOperatorNames: trigFunctions.join(' ') + ' ln log to where'
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
	cell_result.innerText = calculate(exp);
}