import { create_cell } from './cells.js'
import { set_unsaved_changes } from './saves.js';
import './toolbox.js'
import './keybinds.js'

document.querySelectorAll('menu > div > div > div > button').forEach(x => x.addEventListener('click', () => {
	document.activeElement.blur();
}));

create_cell();
set_unsaved_changes(false);