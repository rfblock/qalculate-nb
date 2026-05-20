import { set_unsaved_changes } from './saves.js';
import { greek, calculate } from './calculator.js'
import { parse_mathml } from './parser.js'
import { focus_cell } from './cells.js'
import { run_cell } from './cells.js';

import { MathfieldElement, convertLatexToMathMl } from 'https://esm.run/mathlive'

MathfieldElement.fontsDirectory = 'https://cdn.jsdelivr.net/npm/mathlive/fonts';
MathfieldElement.soundsDirectory = null;

export const MQ = undefined;

let trigFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot']
let hyperbolicFunctions = trigFunctions.map(x => `${x}h`);
trigFunctions = trigFunctions.concat(trigFunctions.map(x => `arc${x}`));
hyperbolicFunctions = hyperbolicFunctions.concat(hyperbolicFunctions.map(x => `ar${x}`));
trigFunctions = trigFunctions.concat(hyperbolicFunctions);

// MQ.config({
// 	autoCommands: 'sqrt pi theta sum nthroot infty ' + greek.join(' '),
// 	sumStartsWithNEquals: true,
// 	autoSubscriptNumerals: true,
// 	autoOperatorNames: trigFunctions.join(' ') + ' ln log to where'
// });

/**
 * @param {HTMLDivElement} cell 
 */
export const create_math_cell = cell => {
	const cell_expr = cell.querySelector('.cell-expression');
	// const field = MQ.MathField(cell_expr, {
	// 	handlers: {
	// 		edit: () => { set_unsaved_changes(true); }
	// 	}
	// });
	const field = new MathfieldElement();
	field.mathModeSpace = '\\,';
	field.defaultMode = 'math';

	field.addEventListener('beforeinput', e => {
		if (e.inputType == 'insertLineBreak') {
			console.log(convertLatexToMathMl(get_math_cell_value(cell)));
			run_cell(cell);
			e.preventDefault();
		}
	});
	field.addEventListener('move-out', e => {
		if (e.detail.direction == 'downward' && cell.nextElementSibling) { focus_cell(cell.nextElementSibling, true) }
		else if (e.detail.direction == 'upward' && cell.previousElementSibling) { focus_cell(cell.previousElementSibling, true) }
		else { return; }
		field.blur();
		e.preventDefault();
	});
	field.addEventListener('change', () => { set_unsaved_changes(); })
	
	cell_expr.appendChild(field);
}

export const get_math_cell_value = cell => {
	return cell.querySelector('math-field').value;
}

export const set_math_cell_content = (cell, content) => {
	cell.querySelector('math-field').value = content;
}

/**
 * @param {HTMLDivElement} cell 
 */
export const run_math_cell = cell => {
	const cell_result = cell.querySelector('.cell-result');
	const val = get_math_cell_value(cell);
	const exp = parse_mathml(convertLatexToMathMl(val));
	if (exp == '') { return; }
	const res = calculate(exp);
	cell_result.textContent = res.res
	res.msgs.forEach(msg => {
		const msg_node = document.createElement('span');
		cell_result.prepend(msg_node);
		msg_node.classList.add('cell-message');
		msg_node.classList.add('message-' + ['info', 'warning', 'error'][msg.type]);
		msg_node.innerText = msg.msg + '\n';
	});
}