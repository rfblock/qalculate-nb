'use strict';

import { restart_calculator } from "./calculator.js";
import { create_cell, set_cell_content, get_cell_type, get_cell_value, box_cell } from "./cells.js";
import { delete_markdown_editors } from "./markdown.js";
import { create_notification, prompt_confirm, prompt_text } from "./notifications.js";

let notebook_name = '';
let unsaved_changes = false;

const set_notebook_name = x => {
	document.querySelector('title').innerText = x || 'Qalculate! Notebook';
	notebook_name = x;
}

const prompt_unsaved_changes = next => {
	if (!unsaved_changes) { next(); return; }

	prompt_confirm('There are unsaved changes.\nAre you sure you want to continue?\n All unsaved changes will be lost.')
		.then(res => { if (res == 'Yes') next(); }, () => {});
}

const AUTOSAVE_INTERVAL = 1000; // TODO: Make this configurable
let last_modification = null;
export const set_unsaved_changes = x => {
	x ??= true;
	unsaved_changes = x;
	if (unsaved_changes) {
		clearTimeout(last_modification);
		last_modification = setTimeout(() => {
			if (!unsaved_changes) { return; }
			if (notebook_name.trim().length == 0) {
				save_notebook(true);
			} else {
				save_notebook();
			}
		}, AUTOSAVE_INTERVAL);
	}
};

/**
 * @type {IDBDatabase | null}
 */
let database = null;

const pending_on_database_load = [];
export const on_database_load = f => {
	if (database != null) { f(); }
	else { pending_on_database_load.push(f); }
}

window.action_new_notebook = () => {
	prompt_unsaved_changes(new_notebook);
};

window.action_save = () => {
	if (notebook_name.trim().length == 0) {
		// Unnamed document
		action_save_as();
		return;
	}
	
	save_notebook();
}

window.onbeforeunload = () => {
	return unsaved_changes ? 'Unsaved Changes' : null;
}

window.action_save_as = () => {
	document.querySelectorAll('dialog').forEach(x => x.close());

	prompt_text(notebook_name ?? '', { value: notebook_name, placeholder: 'Name'})
		.then(value => {
			if (!value) {
				create_notification('Name cannot be empty', 'error');
				return;
			}
			list_notebooks().then(notebooks => {
				const collision = notebooks.map(x => x.notebook_name).includes(value);
				if (collision) {
					prompt_confirm(`${value} already exists. Overwrite?`)
						.catch(() => create_notification('Save Aborted', 'error'))
						.then(res => {
							if (res == 'Yes') {
								set_notebook_name(value);
								save_notebook();
							}
						});
					return;
				}
				set_notebook_name(value);
				save_notebook();
			});
		})
		.catch(() => create_notification('Save Aborted', 'error'));
}

window.action_open_file = () => {
	const open_dialog = () => {
		document.activeElement.blur();
		document.querySelectorAll('dialog').forEach(x => x.close());
		document.querySelectorAll('#open-dialog option').forEach(x => x.remove());
		document.querySelector('#open-dialog').showModal();
		list_notebooks().then(notebooks => {
			const select = document.querySelector('#open-dialog > select');
			notebooks.forEach(nb => {
				const option = document.createElement('option');
				option.value = nb.notebook_name;
				option.innerText = nb.notebook_name;
				select.appendChild(option);
			});
		});
	}

	prompt_unsaved_changes(open_dialog);
}

window.dialog_open_button = () => {
	document.querySelector('#open-dialog').close();
	const val = document.querySelector('#open-dialog > select').value;
	load_notebook(val);
}

const serialize_state = () => {
	const cells = []
	document.querySelectorAll('.cell').forEach(cell => {
		cells.push({
			type: get_cell_type(cell),
			body: get_cell_value(cell),
			boxed: cell.classList.contains('boxed'),
		});
	});

	return {
		notebook_name,
		cells,
	};
}

const save_notebook = (autosave) => {
	autosave ??= false;

	if (database == null) {
		console.error('Unable to save notebook (IndexedDB is not open)');
		create_notification('Save Failed', 'error');
		return;
	}

	const state = serialize_state();
	state.notebook_name = autosave ? 'autosave' : notebook_name;
	if (state.notebook_name.trim().length == 0) {
		console.error('Unable to save notebook (Name cannot be blank)');
		create_notification('Save Failed', 'error');
		return;
	}

	const req = database
		.transaction(['notebooks'], 'readwrite')
		.objectStore('notebooks')
		.put(state);
	req.onsuccess = () => {
		if (!autosave) {
			unsaved_changes = false;
		}
		create_notification('Saved');
	};
	req.onerror = e => {
		console.error(`Unable to save: ${e.target.error?.message}`)
		create_notification('Save Failed', 'error');
	};
}

const load_state = state => {
	set_notebook_name(state.notebook_name);
	
	document.querySelectorAll('.cell').forEach(x => x.remove());
	delete_markdown_editors();

	state.cells.forEach(cell => {
		const e = create_cell(null, cell.type)
		set_cell_content(e, cell.body);
		if (cell.boxed) {
			box_cell(e);
		}
	});

	unsaved_changes = false;
}

const load_notebook = load_name => {
	const req = database
		.transaction(['notebooks'], 'readwrite')
		.objectStore('notebooks')
		.get(load_name);
	req.onerror = e => {
		console.error(`Unable to load: ${e.target.error?.message}`);
		create_notification('Failed Loading Notebook', 'error');
	};
	req.onsuccess = e => {
		const state = e.target.result;
		load_state(state);
	}
}

window.action_export_notebook = () => {
	const filename = (notebook_name || 'untitled') + '.qnb';

	const uri = URL.createObjectURL(new Blob([JSON.stringify(serialize_state())]))
	const anchor = document.createElement('a');
	anchor.href = uri;
	anchor.download = filename;
	anchor.click();
}

window.action_import_notebook = () => {
	prompt_unsaved_changes(() => {
		const input = document.createElement('input');
		input.type = 'file';
		input.onchange = e => {
			const file = e.target.files[0];
			const reader = new FileReader();
			reader.readAsText(file);
			reader.onload = reader_event => {
				const state = JSON.parse(reader_event.target.result);
				state.notebook_name = 'imported-' + state.notebook_name;
				load_state(state);
				create_notification(`Imported ${notebook_name}.qnb`, 'success');
			}
		}
		input.click();
	});
}

export const list_notebooks = () => {
	return new Promise(resolve => {
		database
		.transaction(['notebooks'], 'readonly')
		.objectStore('notebooks')
		.getAll()
		.onsuccess = e => {
			resolve(e.target.result);
		};
	});
}

const new_notebook = () => {
	set_notebook_name('');
	
	document.activeElement.blur();
	document.querySelectorAll('.cell').forEach(x => x.remove());
	delete_markdown_editors();
	restart_calculator();
	create_cell();
	unsaved_changes = false;
}

export const save_formula = (latex, name, category) => {
	database
		.transaction('formulas', 'readwrite')
		.objectStore('formulas')
		.add({latex, name, category});
}

export const list_formulas = () => {
	return new Promise(resolve => {
		database
			.transaction('formulas', 'readonly')
			.objectStore('formulas')
			.getAll()
			.onsuccess = e => {
				resolve(e.target.result);
			};
	});
}

const initialize_database = () => {
	const set_db = db => {
		database = db;
		database.onerror = e => console.log(e.target.error?.message);
		pending_on_database_load.forEach(f => f());
	}

	const req = window.indexedDB.open("Notebooks", 2);
	req.onerror = e => {
		console.error(`Unable to open IndexedDB, ${e.target.error?.message}`)
		create_notification('Failed to start DB', 'error');
	};
	req.onblocked = e => {
		console.error(`Unable to open IndexedDB`);
		create_notification('Failed to update DB\nPlease close other tabs', 'error');
	}
	req.onsuccess = e => set_db(e.target.result);
	req.onupgradeneeded = e => {
		const db = e.target.result;
		if (!db.objectStoreNames.contains('notebooks')) {
			const nbObjectStore = db.createObjectStore('notebooks', { keyPath: 'notebook_name' });
			nbObjectStore.createIndex('notebook_name', 'notebook_name', { unique: true });
			
			nbObjectStore.transaction.oncomplete = e => {
				console.log('Notebooks table successfully created');
			}
		}

		if (!db.objectStoreNames.contains('toolbox')) {
			const toolboxObjectStore = db.createObjectStore('formulas', { autoIncrement: true });
			toolboxObjectStore.transaction.oncomplete = () => {
				console.log('Toolbox table successfully created');
			}
		}
		requestAnimationFrame(() => set_db(db));
	}
}
initialize_database();