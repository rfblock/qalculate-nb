'use strict';

document.addEventListener('keydown', e => {
	// ctrl, alt, shift modifiers
	const keybinds = {
		'ctrl + O': show_open_dialog,
		'ctrl + S': begin_save,
		'ctrl + shift + S': show_save_as_dialog,
		'alt + N': action_new_notebook,
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

const action_about = () => {
	document.querySelector('#about').show();
}