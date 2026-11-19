'use strict';

const preference_def = {
	cells: {
		section: 'Cells',
		properties: {
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
		},
	},
	saving: {
		section: 'Saving',
		properties: {
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
		},
	},
	debug: {
		section: 'Debug',
		properties: {
			print_raw_mathml: {
				title: 'Print Raw MathML',
				description: 'Print the MathML before preprocessing to console.log when a cell is ran',
				type: 'bool',
				default: false,
			},
			print_mathml: {
				title: 'Print MathML',
				description: 'Print the MathML after preprocessing to console.log when a cell is ran',
				type: 'bool',
				default: false,
			},
			print_qalc_expression: {
				title: 'Print Qalc Expression',
				description: 'Print the expression passed to Qalculate to console.log when a cell is ran',
				type: 'bool',
				default: false,
			},
		},
	},
}

export const preferences = {};
window.preferences = preferences;

window.action_preferences = () => {
	document.querySelector('#preferences').showModal();
};

const load_preferences = () => {
	const dialog = document.querySelector('#preferences');
	Object.keys(preference_def).forEach(section_name => Object.keys(preference_def[section_name].properties).forEach(name => {
		const section = preference_def[section_name].section;
		const pref = preference_def[section_name].properties[name];
	
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
		preferences[section_name] ??= {};
		preferences[section_name][name] = get_preference(name) ?? pref.default;

		const li = document.createElement('div');
		dialog.appendChild(li);

		const label = document.createElement('label');
		li.appendChild(label)
			const section_span = document.createElement('span');
			label.appendChild(section_span);
			section_span.textContent = `${section}: `;
			section_span.classList.add('section');

		label.append(pref.title);
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
				input.value = get_preference(section_name, name);
				input.placeholder = pref.default;
			} else if (pref.type == 'bool') {
				input.type = 'checkbox';
				input.checked = preferences[section_name][name];
			}
		} else if (pref.type == 'enum') {
			input = document.createElement('select');
			Object.keys(pref.values).forEach(x => {
				const option = document.createElement('option');
				input.appendChild(option);
				option.value = x;
				option.textContent = pref.values[x];
			});
			input.value = preferences[section_name][name];
		}
		input.id = `preferences-${name}`;
		li.appendChild(input);

		if (pref.visualizer) {
			li.appendChild(pref.visualizer(preferences[section_name][name]));
		}

		input.addEventListener('input', () => {
			const val = pref.type == 'bool' ? input.checked : input.value;
			if (pref.visualizer) {
				li.querySelector('.visualizer').remove();
				li.appendChild(pref.visualizer(input.checked ?? input.value));
			}

			if (val === '') {
				localStorage.clear(`preferences-${section_name}.${name}`);
			} else {
				localStorage.setItem(`preferences-${section_name}.${name}`, val);
			}
			preferences[section_name][name] = get_preference(section_name, name) ?? pref.default;
		});
	}));
}

const get_preference = (sec, pref) => {
	const val = localStorage.getItem(`preferences-${sec}.${pref}`);
	if (val == null) {
		return null;
	}

	if (preference_def[sec].properties[pref].type == 'int') {
		return Number(val);
	}

	if (preference_def[sec].properties[pref].type == 'bool') {
		return val == 'true';
	}

	return val;
}

load_preferences();