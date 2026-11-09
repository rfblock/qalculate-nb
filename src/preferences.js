'use strict';

const preference_def = {
	eval_mode: {
		title: 'Evaluation Mode',
		type: 'enum', 
		values: { 'exact': 'Exact', 'try_exact': 'Approximate (Accurate)', 'approximate': 'Approximate (Fast)' },
		default: 'try_exact',
		description: 'Determines the accuracy of the calculations\nExact: Calculates and displays exact values\nApproximate (Accurate): Calculates exact values and displays approximate value\nApproximate (Fast): Calculates and displays approximate values',
		visualizer: val => {
			const div = document.createElement('div');
			div.classList.add('visualizer');
			const p1 = document.createElement('math-div');
			div.appendChild(p1);
			const p2 = document.createElement('math-div');
			div.appendChild(p2);
			switch (val) {
				case 'exact':
					p1.textContent = '\\sin(\\pi/3) = \\sqrt{3}/2';
					p2.textContent = '\\sin(\\pi/2) = 1'; break;
				case 'try_exact':
					p1.textContent = '\\sin(\\pi/3) \\approx 0.86602540';
					p2.textContent = '\\sin(\\pi/2) = 1'; break;
				case 'approximate':
					p1.textContent = '\\sin(\\pi/3) \\approx 0.86602540';
					p2.textContent = '\\sin(\\pi/2) \\approx 1.0000000'; break;
			}
			return div;
		}
	},
	timeout: {
		title: 'Computation Timeout (ms)',
		type: 'int',
		default: 1000,
		description: 'Maximum computation time before stopping.\nIf set to 0, the computation will go on indefinitely',
	},
	output_type: {
		title: 'Output Formatting',
		type: 'enum',
		values: { 'latex': 'LaTeX', 'ascii': 'ASCII' },
		default: 'latex',
	},
	copy_output_type: {
		title: 'Copy to Clipboard Formatting',
		type: 'enum',
		values: { 'same': 'Same format as shown', 'latex': 'LaTeX always', 'ascii': 'ASCII always' },
		default: 'ascii',
	},
	enable_autosave: {
		title: 'Enable Autosave',
		type: 'bool',
		default: true,
	},
	autosave_interval: {
		title: 'Autosave Interval (ms)',
		type: 'int',
		values: [0, null],
		default: 1000,
	},
	debug_print_raw_mathml: {
		title: 'Debug: Print Raw MathML',
		description: 'Print the MathML before preprocessing to console.log when a cell is ran',
		type: 'bool',
		default: false,
	},
	debug_print_mathml: {
		title: 'Debug: Print MathML',
		description: 'Print the MathML after preprocessing to console.log when a cell is ran',
		type: 'bool',
		default: false,
	},
	debug_print_qalc_expression: {
		title: 'Debug: Print Qalc Expression',
		description: 'Print the expression passed to Qalculate to console.log when a cell is ran',
		type: 'bool',
		default: false,
	},
}

export const preferences = {};
window.preferences = preferences;

window.action_preferences = () => {
	document.querySelector('#preferences').showModal();
};

const load_preferences = () => {
	const dialog = document.querySelector('#preferences');
	Object.keys(preference_def).forEach(name => {
		const pref = preference_def[name];
	
		if (pref.title == undefined) {
			console.warn(`Preference definition ${name} does not contain title`);
			pref.title = name;
		}
		if (pref.type == undefined) {
			console.warn(`Preference definition ${name} does not include type`);
			return;
		}
		if (pref.default == undefined) {
			console.warn(`Preference definition ${name} does not include default`);
			return;
		}
		preferences[name] = get_preference(name) ?? pref.default;

		const li = document.createElement('div');
		dialog.appendChild(li);

		const label = document.createElement('label');
		li.appendChild(label);
		label.textContent = pref.title;
		label.htmlFor = `preferences-${name}`;

		if (pref.description) {
			const p = document.createElement('p');
			li.appendChild(p);
			p.textContent = pref.description;
		}

		let input;
		if (['int', 'bool'].includes(pref.type)) {
			input = document.createElement('input');
			if (pref.type == 'int') {
				input.type = 'number';
				input.min = pref?.values?.[0];
				input.max = pref?.values?.[1];
				input.value = get_preference(name);
				input.placeholder = pref.default;
			} else if (pref.type == 'bool') {
				input.type = 'checkbox';
				input.checked = preferences[name];
			}
		} else if (pref.type == 'enum') {
			input = document.createElement('select');
			Object.keys(pref.values).forEach(x => {
				const option = document.createElement('option');
				input.appendChild(option);
				option.value = x;
				option.textContent = pref.values[x];
			});
			input.value = preferences[name];
		}
		input.id = `preferences-${name}`;
		li.appendChild(input);

		if (pref.visualizer) {
			li.appendChild(pref.visualizer(preferences[name]));
		}

		input.addEventListener('input', () => {
			const val = pref.type == 'bool' ? input.checked : input.value;
			if (pref.visualizer) {
				li.querySelector('.visualizer').remove();
				li.appendChild(pref.visualizer(input.checked ?? input.value));
			}

			if (val === '') {
				localStorage.clear(`preferences-${name}`);
			} else {
				localStorage.setItem(`preferences-${name}`, val);
			}
			preferences[name] = get_preference(name) ?? pref.default;
		});
	});
}

const get_preference = pref => {
	const val = localStorage.getItem(`preferences-${pref}`);
	if (val == null) {
		return null;
	}

	if (preference_def[pref].type == 'int') {
		return Number(val);
	}

	if (preference_def[pref].type == 'bool') {
		return val == 'true';
	}

	return val;
}

load_preferences();