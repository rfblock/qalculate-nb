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
			Module.default_print_options.interval_display = Module.IntervalDisplay.CONCISE;
			Module.default_print_options.spell_out_logical_operators = true;

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