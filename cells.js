'use strict';

import { create_math_cell, get_math_cell_value, run_math_cell, set_math_cell_value, get_math_cell_result, set_math_cell_result } from './math.js'
import { create_markdown_cell, focus_markdown_cell, get_markdown_cell_value, set_markdown_cell_value } from './markdown.js'
import { set_unsaved_changes } from './saves.js';
import { create_notification } from './notifications.js';
import { restart_calculator } from './calculator.js';
import { relist_variables } from './variable-panel.js';

const maximum_state_history = 25;
const past_state_changes = [];
const future_state_changes = [];

window.past_state_changes = past_state_changes;

export const focus_cell = (cell, enter_edit) => {
	if (cell == null) { return; }
	document.querySelectorAll('.cell').forEach(x => x.classList.remove('selected'));
	cell.classList.add('selected');
	if (enter_edit ?? false) {
		cell.querySelector('math-field')?.focus();
		focus_markdown_cell(cell);
	} else {
		cell.focus();
	}
}

export const run_cell = (cell, update_variable_list) => {
	cell ??= document.querySelector('.cell.selected');
	update_variable_list ??= true;
	
	switch (get_cell_type(cell)) {
		case 'math': run_math_cell(cell); break;
		default: return;
	}

	if (update_variable_list) {
		relist_variables();
	}

	set_unsaved_changes();
}

export const clear_cell_history = () => {
	past_state_changes.length = 0;
	future_state_changes.length = 0;
}

window.action_cell_undo = () => {
	if (past_state_changes.length == 0) { return; }

	const change = past_state_changes.pop();

	switch (change.action) {
		case 'delete': {
			const cell = create_cell(get_cell_at(change.position), change.type, false);
			set_cell_value(cell, change.value);
			set_cell_result(cell, change.result);
			future_state_changes.push(change);
			break;
		}
		case 'create': {
			const cell = get_cell_at(change.position);
			future_state_changes.push({
				...change,
				value: get_cell_value(cell),
				result: get_cell_result(cell),
			});
			delete_cell(cell, false);
			break;
		}
		default: {
			console.warn(`Unknown state change action ${change.action}`);
		}
	}
}

window.action_cell_redo = () => {
	if (future_state_changes.length == 0) { return; }

	const change = future_state_changes.pop();

	switch (change.action) {
		case 'delete': {
			const cell = get_cell_at(change.position);
			past_state_changes.push({
				...change,
				value: get_cell_value(cell),
				result: get_cell_result(cell),
			});
			delete_cell(get_cell_at(change.position), false);
			break;
		}
		case 'create': {
			past_state_changes.push(change);
			const cell = create_cell(get_cell_at(change.position), change.type, false);
			set_cell_value(cell, change.value);
			set_cell_result(cell, change.result);
			break;
		}
		default: {
			console.warn(`Unknown state change action ${change.action}`);
		}
	}
}

/**
 * @param {HTMLDivElement} cell 
 */
export const get_cell_type = cell => {
	const types = ['math', 'markdown'];
	for (let type of types) {
		if (cell.classList.contains(`cell-${type}`)) {
			return type;
		}
	}
	
	return null;
}

export const get_cell_value = cell => {
	switch (get_cell_type(cell)) {
		case 'math': return get_math_cell_value(cell);
		case 'markdown': return get_markdown_cell_value(cell);
	}

	return null;
}

export const set_cell_value = (cell, value) => {
	switch (get_cell_type(cell)) {
		case 'math': return set_math_cell_value(cell, value);
		case 'markdown': return set_markdown_cell_value(cell, value);
	}
}

export const get_cell_result = cell => {
	switch (get_cell_type(cell)) {
		case 'math': return get_math_cell_result(cell);
		default: return null
	}
}

export const set_cell_result = (cell, result) => {
	switch (get_cell_type(cell)) {
		case 'math': return set_math_cell_result(cell, result);
		default:
	}
}

const get_cell_index = cell => {
	return [...cell.parentElement.children].indexOf(cell);
}

const get_cell_at = i => {
	return document.querySelector('#notebook-cells').children[i];
}

window.action_run_all = () => {
	document.activeElement.blur();
	restart_calculator().then(() => {
		document.querySelectorAll('.cell').forEach(cell => {
			run_cell(cell, false);
		});
		relist_variables();
	});
}

window.action_clear_all = () => {
	document.activeElement.blur();
	document.querySelectorAll('.cell-result').forEach(result => {
		result.innerText = '';
	});
}

window.insert_cell_above = type => {
	focus_cell(create_cell(document.querySelector('.cell.selected'), type));
}

window.insert_cell_below = type => {
	focus_cell(create_cell(document.querySelector('.cell.selected')?.nextElementSibling, type));
}

export const box_cell = cell => {
	cell ??= document.querySelector('.cell.selected');
	cell.classList.toggle('boxed')
	set_unsaved_changes(true);
}

window.box_cell = box_cell;

const convert_to_markdown = cell => {
	if (get_cell_type(cell) != 'math') { return; }
	if (get_cell_value(cell).trim().length > 0) { return; }
	const md = create_cell(cell, 'markdown');
	focus_cell(md, true);
	delete_cell(cell);
}

export const delete_cell = (cell, change_history) => {
	cell ??= document.querySelector('.cell.selected');
	change_history ??= true;

	if (change_history) {
		if (past_state_changes.length >= maximum_state_history) {
			past_state_changes.shift();
		}

		past_state_changes.push({
			action: 'delete',
			type: get_cell_type(cell),
			position: get_cell_index(cell),
			value: get_cell_value(cell),
			result: get_cell_result(cell),
		});

		future_state_changes.length = 0;
	}
	
	cell.remove();
	set_unsaved_changes();
}

export const create_cell = (ref, type, change_history) => {
	set_unsaved_changes(true);
	ref ??= null;
	type ??= 'math';
	change_history ??= true;
	
	const cell = document.createElement('div');
	cell.classList.add('cell', `cell-${type}`);
	cell.tabIndex = 0;

		const cell_expr = document.createElement('span');
		cell.appendChild(cell_expr);
		cell_expr.classList.add('cell-expression');

	cell.addEventListener('keydown', e => {
		if (e.repeat) { return; }
		if (cell_expr.contains(document.activeElement)) { return; }
		if (e.key == 'ArrowUp') { focus_cell(cell.previousElementSibling); }
		if (e.key == 'ArrowDown') { focus_cell(cell.nextElementSibling); }
		if (e.key == 'Enter') { focus_cell(cell, true); e.preventDefault(); }
		if (e.key == 'a') { focus_cell(create_cell(cell)); }
		if (e.key == 'b') { focus_cell(create_cell(cell.nextElementSibling)); }
		if (e.key == 'd') {
			if (cell.nextElementSibling != null) {
				focus_cell(cell.nextElementSibling);
			} else {
				focus_cell(cell.previousElementSibling);
			}
			set_unsaved_changes(true);
			delete_cell(cell);
		}
		if (e.key == 'm') { convert_to_markdown(cell); }
		if (e.key == 'z') { window.action_cell_undo(cell); }
	});

		const cell_result = document.createElement('span');
		cell.appendChild(cell_result);
		cell_result.classList.add('cell-result');
		cell_result.tabIndex = 0;
		cell_result.addEventListener('click', () => {
			if (!cell_result.innerText) { return; }
			navigator.clipboard.writeText(cell_result.innerText)
				.then(() => { create_notification('Copied', 'success') })
				.catch(() => { create_notification('Failed to copy', 'error') });
		});

		cell_expr.addEventListener('keydown', e => {
			if (e.repeat) { return; }
			if (e.key != 'Escape') { return; }

			focus_cell(cell);
		});

		const delete_cell_btn = document.createElement('div');
		cell.appendChild(delete_cell_btn);
		delete_cell_btn.classList.add('trash');
		delete_cell_btn.addEventListener('click', () => delete_cell(cell));

		const footer_buttons = document.createElement('div');
		footer_buttons.classList.add('footer-buttons');
		cell.appendChild(footer_buttons);

		const append_math_btn = document.createElement('span')
		footer_buttons.appendChild(append_math_btn);
		append_math_btn.innerText = '+Math';
		append_math_btn.addEventListener('click', () => create_cell(cell.nextElementSibling, 'math'));

		const append_md_btn = document.createElement('span')
		footer_buttons.appendChild(append_md_btn);
		append_md_btn.innerText = '+Markdown';
		append_md_btn.addEventListener('click', () => create_cell(cell.nextElementSibling, 'markdown'));

	cell.addEventListener('click', e => focus_cell(cell, true));

	switch (type) {
		case 'math': create_math_cell(cell); break;
		case 'markdown': create_markdown_cell(cell); break;
	}

	document.querySelector('#notebook-cells').insertBefore(cell, ref);

	if (change_history) {
		if (past_state_changes.length >= maximum_state_history) {
			past_state_changes.shift();
		}

		past_state_changes.push({
			action: 'create',
			type,
			position: get_cell_index(cell),
		});
		future_state_changes.length = 0;
	}

	return cell;
}