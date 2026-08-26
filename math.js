'use strict';

import { set_unsaved_changes } from './saves.js';
import { calculate } from './calculator.js';
import { parse_mathml } from './parser.js';
import { focus_cell, run_cell } from './cells.js';

import { MathfieldElement, convertLatexToMathMl } from 'https://esm.run/mathlive';

MathfieldElement.fontsDirectory = 'https://cdn.jsdelivr.net/npm/mathlive/fonts';
MathfieldElement.soundsDirectory = null;

let trigFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot']
let hyperbolicFunctions = trigFunctions.map(x => `${x}h`);
trigFunctions = trigFunctions.concat(trigFunctions.map(x => `arc${x}`));
hyperbolicFunctions = hyperbolicFunctions.concat(hyperbolicFunctions.map(x => `ar${x}`));
trigFunctions = trigFunctions.concat(hyperbolicFunctions);

/**
 * @param {HTMLDivElement} cell 
 */
export const create_math_cell = cell => {
	const cell_expr = cell.querySelector('.cell-expression');
	const field = new MathfieldElement();
	field.mathModeSpace = '\\,';
	field.defaultMode = 'math';

	field.addEventListener('mount', () => {
		field.keybindings = [
			...field.keybindings,
			{
				key: 'ctrl+[Enter]',
				command: [],
			},
			{
				key: 'alt+[Enter]',
				command: [],
			},
			{
				key: 'alt+shift+[Enter]',
				command: [],
			},
		];
	});

	field.addEventListener('click', e => {
		focus_cell(cell, true);
	});

	field.addEventListener('beforeinput', e => {
		if (e.inputType == 'insertLineBreak') {
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
	field.addEventListener('input', () => cell.querySelector('.cell-result').classList.add('changes'));
	field.addEventListener('change', () => set_unsaved_changes() );
	
	cell_expr.appendChild(field);
}

export const get_math_cell_value = cell => {
	return cell.querySelector('math-field').value;
}

export const set_math_cell_value = (cell, value) => {
	cell.querySelector('math-field').value = value;
}

export const get_math_cell_result = cell => {
	return [...cell.querySelectorAll('.cell-result > div')].map(div => {
		const img = div.querySelector('img');
		if (img) { return {
			type: 'plot-src',
			value: img.src,
		}; }

		if (div.classList.contains('cell-message')) {
			let level = 'unknown';
			if (div.classList.contains('message-info')) { level = 'info' }
			if (div.classList.contains('message-warning')) { level = 'warning' }
			if (div.classList.contains('message-error')) { level = 'error' }
			return {
				type: 'message',
				level,
				value: div.textContent,
			};
		}

		return {
			type: 'output',
			value: div.textContent,
		}
	});
}

export const set_math_cell_result = (cell, result) => {
	const div = cell.querySelector('.cell-result')
	div.classList.remove('changes');
	div.textContent = '';

	result.forEach(res => {
		const elem = document.createElement('div');
		switch (res.type) {
			case 'message': {
				elem.textContent = res.value
				elem.classList.add('cell-message');
				elem.classList.add(`message-${res.level}`);
				break;
			}
			case 'output': {
				elem.textContent = res.value;
				break;
			}
			case 'plot': {
				elem.appendChild(res.value);
				break;
			}
			case 'plot-src': {
				const img = new Image(600, 400);
				img.src = res.value;
				elem.appendChild(img);
				break;
			}
			default: return;
		}

		div.appendChild(elem);
	});
}

/**
 * @param {HTMLDivElement} cell 
 */
export const run_math_cell = cell => {
	const val = get_math_cell_value(cell);
	let exp;

	try {
		exp = parse_mathml(convertLatexToMathMl(val));
	} catch (e) {
		set_math_cell_result(cell, [{
			type: 'message',
			level: 'error',
			value: e.message,
		}]);
		return;
	}

	if (exp == '') { return; }

	const output = [];
	const res = calculate(exp);

	res.msgs.forEach(msg => {
		output.push({
			type: 'message',
			level: ['info', 'warning', 'error'][msg.type],
			value: msg.msg,
		});
	});

	if (res.res instanceof Array) {
		res.res.forEach(plot => output.push({
			type: 'plot',
			value: plot,
		}));
	} else {
		output.push({
			type: 'output',
			value: res.res,
		});
	}

	set_math_cell_result(cell, output);
}