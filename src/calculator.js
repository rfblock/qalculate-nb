import LoadModule from './qalc.js'
import { create_notification } from './notifications.js';

export const greek = [
	'alpha', 'beta', 'gamma', 'Gamma', 'Delta', 'delta', 'epsilon', 'zeta', 'eta', 'Theta', 'theta',
	'kappa', 'Lambda', 'lambda', 'mu', 'nu', 'Xi', 'xi', 'pi', 'rho', 'sigma', 'Phi', 'phi', 'chi', 'Psi',
	'Omega', 'omega'
]
// Pi and Sigma are not included due to product and sum notation
// psi is not included due to conflict with the unit [lbs/sqin]

let calc;
let Module;

export const calculate = exp => {
	try {
		return calc.calculateAndPrint(exp, 1000,
			Module.default_user_evaluation_options,
			Module.default_print_options
		);
	} catch (e) {
		console.log(e);
		create_notification('An error has occured,\nRestarting the kernel', 'error');
		restart_calculator();
	}
}

export const restart_calculator = () => {
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

		calc = new Module.Calculator();
		calc.loadGlobalDefinitions();
	});
}

if (calc === undefined) {
	calc = null;
	restart_calculator();
}