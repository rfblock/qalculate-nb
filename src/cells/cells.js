'use strict';

import { MQ, create_math_cell, get_math_cell_value, run_math_cell, set_math_cell_content } from './math.js'
import { create_markdown_cell, get_markdown_cell_value, set_markdown_cell_content } from './markdown.js'
import { set_unsaved_changes } from './saves.js';
import { create_notification } from './notifications.js';

export const focus_cell = (cell, enter_edit) => {
	if (cell == null) { return; }
	document.querySelectorAll('.cell').forEach(x => x.classList.remove('selected'));
	document.querySelectorAll('.cell-expression').forEach(x => MQ(x)?.blur());
	cell.classList.add('selected');
	if (enter_edit ?? false) {
		MQ(cell.querySelector('.cell-expression'))?.focus();
	} else {
		cell.focus();
	}
}

const run_cell = cell => {
	switch (get_cell_type(cell)) {
		case 'math': run_math_cell(cell); break;
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

export const set_cell_content = (cell, content) => {
	switch (get_cell_type(cell)) {
		case 'math': return set_math_cell_content(cell, content);
		case 'markdown': return set_markdown_cell_content(cell, content);
	}
}

window.action_run_all = () => {
	document.activeElement.blur();
	document.querySelectorAll('.cell').forEach(cell => {
		run_cell(cell);
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
	cell.remove();
}

export const create_cell = (ref, type) => {
	set_unsaved_changes(true);
	ref ??= null;
	type ??= 'math';
	const cell = document.createElement('div');
	cell.classList.add('cell', `cell-${type}`);
	cell.tabIndex = 0;
	cell.addEventListener('keydown', e => {
		if (e.repeat) { return; }
		if (cell.querySelector('.cell-expression.mq-focused') != null) { return; }
		if (cell.querySelector('.cell-expression > .ProseMirror-focused') != null) { return; }
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
			cell.remove();
		}
		if (e.key == 'm') { convert_to_markdown(cell); }
	});
		const cell_expr = document.createElement('span');
		cell.appendChild(cell_expr);
		cell_expr.classList.add('cell-expression');

		const cell_result = document.createElement('span');
		cell.appendChild(cell_result);
		cell_result.classList.add('cell-result');
		cell_result.tabIndex = 0;
		cell_result.addEventListener('click', () => {
			navigator.clipboard.writeText(cell_result.innerText)
				.then(() => { create_notification('Copied', 'success') })
				.catch(() => { create_notification('Failed to copy', 'error') });
		});

		cell_expr.addEventListener('keydown', e => {
			if (e.repeat) { return; }
			if (e.key != 'Escape') { return; }

			focus_cell(cell);
		});

	cell.addEventListener('click', e => focus_cell(e.currentTarget, true));

	switch (type) {
		case 'math': create_math_cell(cell); break;
		case 'markdown': create_markdown_cell(cell); break;
	}

	document.querySelector('#notebook-cells').insertBefore(cell, ref);
	return cell;
}