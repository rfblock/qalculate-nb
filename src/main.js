let MQ = MathQuill.getInterface(2);

MQ.config({
	autoCommands: 'sqrt pi theta sum int nthroot',
	autoOperatorNames: keyword_tokens.join(' ') + ' mm ft in deg rad to ln log',	
	sumStartsWithNEquals: true,
	autoSubscriptNumerals: true,
});

let problemSpan = document.getElementById('problem');
MQ.StaticMath(problemSpan);

let field = MQ.MathField(document.querySelector('#answer'), {
	handlers: {
		enter: () => {
			exp = parse_latex(field.latex());
			let res = calc.calculateAndPrint(exp, 1000,
				Module.default_user_evaluation_options,
				Module.default_print_options
			);
			document.querySelector('#result').innerText = res;
		}
	}
});

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
