'use strict';

let notebook_name = '';
let last_save = null;
let unsaved_changes = false;

/**
 * @type {IDBDatabase | null}
 */
let database = null;

const pending_on_database_load = [];
const on_database_load = f => {
	if (database != null) { f(); }
	else { pending_on_database_load.push(f); }
}

const action_new_notebook = () => {
	if (!unsaved_changes) {
		new_notebook();
		return;
	}

	prompt_confirm('There are unsaved changes.\nAre you sure?')
		.then(res => {
			if (res == 'Yes') { new_notebook(); }
		})
		.catch(() => {});
};

const begin_save = () => {
	if (notebook_name.trim().length == 0) {
		// Unnamed document
		show_save_as_dialog();
		return;
	}
	
	save_notebook();
}

window.onbeforeunload = () => {
	return unsaved_changes ? 'Unsaved Changes' : null;
}

const show_save_as_dialog = () => {
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

const show_open_dialog = () => {
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

	prompt_confirm('There are unsaved changes\nAre you sure?')
		.catch(() => {})
		.then(res => {
			if (res == 'Yes') { open_dialog(); }
		});
}

const dialog_open_button = () => {
	document.querySelector('#open-dialog').close();
	const val = document.querySelector('#open-dialog > select').value;
	load_notebook(val);
}

const serialize_state = () => {
	const cells = []
	document.querySelectorAll('.cell-expression').forEach(elem => {
		const cell = MQ(elem);
		cells.push({
			type: 'qalc',
			body: cell.latex(),
		});
	});

	return {
		notebook_name,
		cells,
	};
}

const save_notebook = () => {
	if (database == null) {
		console.error('Unable to save notebook (IndexedDB is not open)');
		create_notification('Save Failed', 'error');
		return;
	}

	const state = serialize_state();
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
		unsaved_changes = false;
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

		state.cells.forEach(cell => {
			if (cell.type != 'qalc') {
				console.error(`Unknown cell type ${cell.type}`);
				return;
			}
			MQ(create_cell().querySelector('.cell-expression')).latex(cell.body);
		});
		unsaved_changes = false;
	}
}

const list_notebooks = () => {
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
	create_cell();
	unsaved_changes = false;
}

const save_formula = (latex, name, category) => {
	database
		.transaction('formulas', 'readwrite')
		.objectStore('formulas')
		.add({latex, name, category});
}

const list_formulas = () => {
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
	req.onsuccess = e => set_db(e.target.result);
	req.onupgradeneeded = e => {
		set_db(e.target.result);
		if (!database.objectStoreNames.contains('notebooks')) {
			const nbObjectStore = database.createObjectStore('notebooks', { keyPath: 'notebook_name' });
			nbObjectStore.createIndex('notebook_name', 'notebook_name', { unique: true });
			
			nbObjectStore.transaction.oncomplete = e => {
				console.log('Notebooks table successfully created');
			}
		}

		if (!database.objectStoreNames.contains('toolbox')) {
			const toolboxObjectStore = database.createObjectStore('formulas', { autoIncrement: true });
			toolboxObjectStore.transaction.oncomplete = () => {
				console.log('Toolbox table successfully created');
			}
		}
	}
}
initialize_database();