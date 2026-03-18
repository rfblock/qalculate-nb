let MQ = MathQuill.getInterface(2);

MQ.config({
	autoCommands: 'sqrt pi theta sum int nthroot',
	autoOperatorNames: 'sin cos tan arcsin arccos arctan deg pi mm mi ft yd in deg rad to ln log',	
	sumStartsWithNEquals: true,
	autoSubscriptNumerals: true,
});

let problemSpan = document.getElementById('problem');
MQ.StaticMath(problemSpan);

const focus_cell = (cell, enter_edit) => {
	if (cell == null) { return; }
	document.querySelectorAll('.cell').forEach(x => x.classList.remove('selected'));
	cell.classList.add('selected');
	if (enter_edit ?? true) {
		MQ(cell.querySelector('.cell-expression')).focus();
	} else {
		cell.focus();
	}
}

const create_cell = ref => {
	ref ??= null;
	const cell = document.createElement('div');
	cell.classList.add('cell');
	cell.tabIndex = 0;
	cell.addEventListener('keydown', e => {
		if (e.repeat) { return; }
		if (cell.querySelector('.cell-expression.mq-focused') != null) { return; }
		if (e.key == 'ArrowUp') { focus_cell(cell.previousElementSibling, false); }
		if (e.key == 'ArrowDown') { focus_cell(cell.nextElementSibling, false); }
		if (e.key == 'Enter') { focus_cell(cell); e.preventDefault(); }
		if (e.key == 'a') { focus_cell(create_cell(cell), false); }
		if (e.key == 'b') { focus_cell(create_cell(cell.nextElementSibling), false); }
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

			console.log('escape');
			cell.focus();
		});

		const field = MQ.MathField(cell_expr, {
			handlers: {
				upOutOf: () => focus_cell(cell.previousElementSibling),
				downOutOf: () => focus_cell(cell.nextElementSibling),
				enter: () => {
					exp = parse_latex(field.latex());
					if (exp == '') { return; }
					let res = calc.calculateAndPrint(exp, 1000,
						Module.default_user_evaluation_options,
						Module.default_print_options
					);
					cell_result.innerText = res;
				},
			}
		});

	cell.addEventListener('click', e => focus_cell(e.currentTarget));

	document.querySelector('#notebook-cells').insertBefore(cell, ref);
	return cell;
}
create_cell();

var Module = {
	postRun: () => {
		console.time('new');
		window.calc = new Module.Calculator();
		calc.loadGlobalDefinitions();
		console.timeEnd('new');

		Module.default_print_options.interval_display = Module.IntervalDisplay.CONCISE;

		// newCell();
	},
	print: function (text) {
		if (arguments.length > 1)
			text = Array.prototype.slice.call(arguments).join(' ');
		console.log(text);
	},
	printErr: function (text) {
		if (arguments.length > 1)
			text = Array.prototype.slice.call(arguments).join(' ');
		console.error(text);
	},
	setStatus: function (text) {
		console.log(text);
		if (!Module.setStatus.last)
			Module.setStatus.last = { time: Date.now(), text: '' };
		if (text === Module.setStatus.last.text) return;
		var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
		var now = Date.now();
		if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
		Module.setStatus.last.time = now;
		Module.setStatus.last.text = text;
		if (m) {
			text = m[1];
		}
		// statusElement.innerHTML = text;
	},
	totalDependencies: 0,
	monitorRunDependencies: function (left) {
		this.totalDependencies = Math.max(this.totalDependencies, left);
		Module.setStatus(
			left
				? 'Preparing... (' +
					  (this.totalDependencies - left) +
					  '/' +
					  this.totalDependencies +
					  ')'
				: 'All downloads complete.'
		);
	},
};
Module.setStatus('Downloading...');
window.onerror = function (event) {
	// TODO: do not warn on ok events like simulating an infinite loop or exitStatus
	Module.setStatus('Exception thrown, see JavaScript console');
	Module.setStatus = function (text) {
		if (text) Module.printErr('[post-exception status] ' + text);
	};
};
