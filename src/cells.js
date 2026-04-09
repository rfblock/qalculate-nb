'use strict';

let MQ = MathQuill.getInterface(2);

MQ.config({
	autoCommands: 'sqrt pi theta sum nthroot infty ' + greek.join(' '),
	sumStartsWithNEquals: true,
	autoSubscriptNumerals: true,
	autoOperatorNames: 'sin cos tan arcsin arccos arctan ln log to' + Module.units
});

const focus_cell = (cell, enter_edit) => {
	if (cell == null) { return; }
	document.querySelectorAll('.cell').forEach(x => x.classList.remove('selected'));
	document.querySelectorAll('.cell-expression').forEach(x => MQ(x).blur());
	cell.classList.add('selected');
	if (enter_edit ?? false) {
		MQ(cell.querySelector('.cell-expression')).focus();
	} else {
		cell.focus();
	}
}

const run_cell = cell => {
	const field = MQ(cell.querySelector('.cell-expression'));
	const cell_result = cell.querySelector('.cell-result');
	const exp = parse_latex(field.latex());
	if (exp == '') { return; }
	let res = calc.calculateAndPrint(exp, 1000,
		Module.default_user_evaluation_options,
		Module.default_print_options
	);
	cell_result.innerText = res;
}

const run_all = () => {
	document.activeElement.blur();
	document.querySelectorAll('.cell').forEach(cell => {
		run_cell(cell);
	});
}

const clear_all_outputs = () => {
	document.activeElement.blur();
	document.querySelectorAll('.cell-result').forEach(result => {
		result.innerText = '';
	});
}

const insert_cell_above = () => {
	focus_cell(create_cell(document.querySelector('.cell.selected')));
}

const insert_cell_below = () => {
	focus_cell(create_cell(document.querySelector('.cell.selected').nextElementSibling));
}

const create_cell = ref => {
	unsaved_changes = true;
	ref ??= null;
	const cell = document.createElement('div');
	cell.classList.add('cell');
	cell.tabIndex = 0;
	cell.addEventListener('keydown', e => {
		if (e.repeat) { return; }
		if (cell.querySelector('.cell-expression.mq-focused') != null) { return; }
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
			unsaved_changes = true;
			cell.remove();
		}
	});
		const cell_expr = document.createElement('span');
		cell.appendChild(cell_expr);
		cell_expr.classList.add('cell-expression');

		const cell_result = document.createElement('span');
		cell.appendChild(cell_result);
		cell_result.classList.add('cell-result');
		cell_result.tabIndex = 0;

		cell_expr.addEventListener('keydown', e => {
			if (e.repeat) { return; }
			if (e.key != 'Escape') { return; }

			focus_cell(cell);
		});

		const field = MQ.MathField(cell_expr, {
			handlers: {
				upOutOf: () => focus_cell(cell.previousElementSibling, true),
				downOutOf: () => focus_cell(cell.nextElementSibling, true),
				enter: () => run_cell(cell),
				edit: () => { unsaved_changes = true; }
			}
		});

	cell.addEventListener('click', e => focus_cell(e.currentTarget, true));

	document.querySelector('#notebook-cells').insertBefore(cell, ref);
	return cell;
}