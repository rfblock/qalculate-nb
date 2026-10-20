import LoadModule from './qalc.js'
import { create_notification } from './notifications.js';
import { relist_variables } from './variable-panel.js';

let calc;
let Module;
let gnuplot_worker;
let pending_plots = {};
let new_plots = [];

export const calculate = exp => {
	let res;

	try {
		res = calc.calculateAndPrint(exp, 1000,
			Module.default_user_evaluation_options,
			Module.default_print_options
		);
	} catch (e) {
		console.error(e);
		create_notification('An error has occurred,\nRestarting the kernel', 'error');
		restart_calculator();
		return;
	}

	if (new_plots.length > 0) {
		res = [...new_plots];
		new_plots.length = 0;
	} else {
		res = calc.parse(res);
		res.format(Module.default_print_options);
		res = print_math_structure(res);
	}

	const msgs = [];
	for (let msg = calc.message(); msg != null; msg = calc.nextMessage()) {
		msgs.push({
			msg: msg.message(),
			type: msg.type().value,
		});
	}
	return { res, msgs };
}

const print_math_structure = (root, paren_level = 0) => {
	const paren_levels = {
		none: 0,
		add: 1,
		mul: 2,
	};

	const types = Module.StructureType;
	let children = [];
	for (let i = 1; i <= root.countChildren(); i++) {
		children.push(root.getChild(i));
	}

	switch (root.type()) {
		case types.NUMBER:
		case types.SYMBOLIC:
			return root.print(Module.default_print_options);
		case types.VARIABLE:
			return root.variable().name();
		case types.UNIT:
			return `\\operatorname{${root.print(Module.default_print_options)}}`;
		default:
			if (children.length == 0) {
				return root.print(Module.default_print_options);
			}
	}

	switch (root.type()) {
		case types.MULTIPLICATION:
			children = children.map(x => print_math_structure(x, paren_levels.add));
			return paren_level >= paren_levels.mul
				? `\\left(${children.join("\\cdot ")}\\right)`
				: children.join("\\cdot ");
		case types.INVERSE:
			children = children.map(print_math_structure);
			return `\\frac1{${children[0]}}`;
		case types.DIVISION:
			children = children.map(print_math_structure);
			return `\\frac{${children[0]}}{${children[1]}}`;
		case types.ADDITION: {
			let s = print_math_structure(children.shift());
			for (const child of children) {
				if (child.type() == types.NEGATE) {
					s += `-${print_math_structure(child.getChild(1))}`;
				} else {
					s += `+${print_math_structure(child)}`;
				}
			}
			return paren_level >= paren_levels.add ? `\\left(${s}\\right)` : s;
		}
		case types.NEGATE:
			children = children.map(print_math_structure);
			return `-${children[0]}`;
		case types.POWER:
			const base = print_math_structure(children[0], paren_levels.mul);
			const exp = print_math_structure(children[1]);
			return `${base}^{${exp}}`;
		case types.FUNCTION:
			const fcn = root.getFunctionName();
			if (fcn == 'integrate') {
				children[0] = print_math_structure(children[0], paren_levels.add);
				for (let i = 1; i < children.length; i++) {
					children[i] = print_math_structure(children[i]);
				}
				if (children[1] == 'undefined') {
					return `\\int ${children[0]}`;
				}
				if (children[3] == 'undefined') {
					return `\\int_{${children[1]}}^{${children[2]}}${children[0]}`;
				}
				return `\\int_{${children[1]}}^{${children[2]}}${children[0]}\\mathrm{d}${children[3]}`;
			}
			children = children.map(print_math_structure);
			switch (fcn) {
				case 'sqrt':
					return `\\sqrt{${children[0]}}`;
				case 'cbrt':
					return `\\sqrt[3]{${children[0]}}`;
				case 'root':
					return `\\sqrt[${children[1]}]{${children[0]}}`;
				case 'abs':
					return `\\left|${children[0]}\\right|`;
				case 'dirac':
					return `\\delta\\left(${children[0]}\\right)`;
				case 'heaviside':
					return `\\theta\\left(${children[0]}\\right)`;
				default:
			}
			return `\\operatorname{${root.getFunctionName()}}\\left(${children.join(', ')}\\right)`
		case types.VECTOR:
			const rows = root.rows();
			const cols = root.columns();
			let s = '';
			if (rows == 1) {
				s = children.map(x => print_math_structure(x)).join(' & ');
				return `\\begin{bmatrix}${s}\\end{bmatrix}`
			}
			for (let i = 0; i < rows; i++) {
				const row = children[i];
				const row_items = [];
				for (let j = 1; j <= cols; j++) {
					row_items.push(print_math_structure(row.getChild(j)));
				}
				s += row_items.join(' & ') + ' \\\\';
			}
			return `\\begin{bmatrix}${s}\\end{bmatrix}`
		default:
			return root.print(Module.default_print_options);
	}
}

export const get_variables = () => {
	const local_variables = [];
	let i = 0;
	let v;
	do {
		v = calc.variables.get(i++);
		if (!v?.isLocal()) { continue; }
		local_variables.push({
			name: v.name(),
			value: v.toKnownVariable().get().print(Module.default_print_options),
		});
	} while (v != null);

	return local_variables;
}

export const restart_calculator = () => {
	return new Promise((resolve, reject) => {
		LoadModule({
			print: function (text) {
			if (arguments.length > 1)
				text = Array.prototype.slice.call(arguments).join(' ');
				console.log(text);
			},
			printErr: function (text) {},
			totalDependencies: 0,
			monitorRunDependencies: function (left) {
				this.totalDependencies = Math.max(this.totalDependencies, left);
				console.log(
					left
						? 'Preparing... (' +
							(this.totalDependencies - left) +
							'/' +
							this.totalDependencies +
							')'
						: 'All downloads complete.'
				);
			},
		}).then(_module => {
			Module = _module;
			window.Module = Module;
			Module.default_print_options.interval_display = Module.IntervalDisplay.CONCISE;
			Module.default_print_options.spell_out_logical_operators = true;
			Module.default_print_options.spacious = false;
			Module.default_print_options.use_unicode_signs = Module.UNICODE_SIGNS.WITHOUT_EXPONENTS.value;
			// Module.default_print_options.excessive_parenthesis = true;
			// Module.default_print_options.limit_implicit_multiplication = false;
			// Module.default_print_options.short_multiplication = true;

			Module.default_user_evaluation_options.approximation = Module.ApproximationMode.APPROXIMATE;
			window.po = Module.default_print_options;
			window.eo = Module.default_user_evaluation_options;

			calc = new Module.Calculator();
			window.calc = calc;
			calc.loadGlobalDefinitions();
			relist_variables();
			resolve();
		});
	});
}

const create_svg_URI = data => `data:image/svg+xml;utf8,${encodeURIComponent(data)}`;

window.runGnuplot = (data_files, commands, extra_commandline, persist) => {
	if (!gnuplot_worker) {
		gnuplot_worker = new Worker('gnuplot-worker.js');
		gnuplot_worker.addEventListener('message', e => {
			const { id, output } = e.data;
			const plot = pending_plots[id];

			const svg = new DOMParser().parseFromString(output, 'text/xml');
			const uri = create_svg_URI(svg.querySelector('svg').outerHTML);

			if (output) {
				plot.src = uri;
				delete pending_plots[id];
			} else {
				// TODO: Replace with error
			}
		});
	}

	// empty SVG url
	const id = Math.random().toString(36).slice(2);
	const plot = new Image(600, 400);
	pending_plots[id] = plot;
	new_plots.push(plot);

	gnuplot_worker.postMessage({
		data_files, commands, extra_commandline, persist, id
	});

	return true;
}

if (calc === undefined) {
	calc = null;
	restart_calculator();
}