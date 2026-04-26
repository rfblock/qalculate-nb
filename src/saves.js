'use strict';

import { create_cell, set_cell_content, get_cell_type, get_cell_value, box_cell } from "./cells.js";
import { delete_markdown_editors } from "./markdown.js";
import { create_notification, prompt_confirm, prompt_text } from "./notifications.js";

let notebook_name = '';
let unsaved_changes = false;

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
	if (!unsaved_changes) {
		new_notebook();
		return;
	}

	prompt_confirm('There are unsaved changes.\nAre you sure you want to continue?\n All unsaved changes will be lost.')
		.then(res => {
			if (res == 'Yes') { new_notebook(); }
		})
		.catch(() => {});
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
								notebook_name = value;
								save_notebook();
							}
						});
					return;
				}
				notebook_name = value;
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

	if (!unsaved_changes) {
		open_dialog();
		return;
	}

	prompt_confirm('There are unsaved changes.\nAre you sure you want to continue?\n All unsaved changes will be lost.')
		.catch(() => {})
		.then(res => {
			if (res == 'Yes') { open_dialog(); }
		});
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

const save_notebook = autosave => {
	autosave ??= false;

	if (database == null) {
		console.error('Unable to save notebook (IndexedDB is not open)');
		create_notification('Save Failed', 'error');
		return;
	}

	const state = serialize_state();
	const nb_name = state.notebook_name = autosave ? 'autosave' : notebook_name;
	if (nb_name.trim().length == 0) {
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
		create_notification('Saved', 'success');
	};
	req.onerror = e => {
		console.error(`Unable to save: ${e.target.error?.message}`)
		create_notification('Save Failed', 'error');
	};
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
		notebook_name = state.notebook_name;
		
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
	notebook_name = '';
	
	document.activeElement.blur();
	document.querySelectorAll('.cell').forEach(x => x.remove());
	delete_markdown_editors()
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