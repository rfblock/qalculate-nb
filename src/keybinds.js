'use strict';

import { run_cell } from './cells.js'

document.addEventListener('keydown', e => {
	// ctrl, alt, shift modifiers
	const keybinds = {
		'ctrl + O': action_open_file,
		'ctrl + S': action_save,
		'ctrl + shift + S': action_save_as,
		'alt + N': action_new_notebook,
		// 'ctrl + I': action_import_notebook,
		'ctrl + E': action_export_notebook,
		'alt + R': action_run_all,
		'alt + C': action_clear_all,
		'alt + T': action_toolbox,

		'alt + Enter': () => { run_cell(); insert_cell_below('math'); }
	};

	if (e.repeat) { return; }

	Object.entries(keybinds).forEach(keybind => {
		const keys = keybind[0].split('+').map(x => x.trim());
		const modifiers = keys.splice(0, keys.length - 1);
		const key = keys[0].toLowerCase();
		if (modifiers.includes('ctrl') != e.ctrlKey) { return; }
		if (modifiers.includes('alt') != e.altKey) { return; }
		if (modifiers.includes('shift') != e.shiftKey) { return; }
		if (key != e.key.toLowerCase()) { return; }

		keybind[1]();
		e.preventDefault();
	});
});

window.action_about = () => {
	document.querySelector('#about').showModal();
}

window.action_whats_new = () => {
	document.querySelector('#whats-new').showModal();
}