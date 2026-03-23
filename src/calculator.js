var Module = {
	postRun: () => {
		console.time('Loaded qalculate in');
		window.calc = new Module.Calculator();
		calc.loadGlobalDefinitions();
		console.timeEnd('Loaded qalculate in');

		Module.default_print_options.interval_display = Module.IntervalDisplay.CONCISE;

		units = '';
		for (let i = 0; i < calc.units.size(); i++) {
			const name = calc.units.get(i).abbreviation();
			if (name.length < 2) { continue; }
			if (name.includes('_')) { continue; }
			units += ' ' + name;
		}

		MQ.config({
			autoOperatorNames: 'sin cos tan arcsin arccos arctan ln log to' + units
		});

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
