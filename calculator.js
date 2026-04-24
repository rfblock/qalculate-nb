import LoadModule from './qalc.js'

export const greek = [
	'alpha', 'beta', 'gamma', 'Gamma', 'Delta', 'delta', 'epsilon', 'zeta', 'eta', 'Theta', 'theta',
	'kappa', 'Lambda', 'lambda', 'mu', 'nu', 'Xi', 'xi', 'pi', 'rho', 'sigma', 'Phi', 'phi', 'chi', 'Psi',
	'Omega', 'omega'
]
// Pi and Sigma are not included due to product and sum notation
// psi is not included due to conflict with the unit [lbs/sqin]

export let calc;
export let Module;

LoadModule({
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
	
	console.time('Loaded qalculate in');
	calc = new Module.Calculator();
	window.calc = calc;
	calc.loadGlobalDefinitions();
	console.timeEnd('Loaded qalculate in');

	Module.default_print_options.interval_display = Module.IntervalDisplay.CONCISE;

});