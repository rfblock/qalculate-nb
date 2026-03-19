'use strict';

let notebook_name = '';
let uuid = null;

/**
 * @type {IDBDatabase | null}
 */
let database = null;

const begin_save = () => {
	if (uuid != null) {
		save_notebook();
		return;
	}

	show_save_as_dialog();
}

const show_save_as_dialog = () => {
	document.querySelector('#save-as-dialog > input').value = notebook_name;
	document.querySelector('#save-as-dialog').showModal();
}

const dialog_save_button = () => {
	notebook_name = document.querySelector('#save-as-dialog > input').value;
	document.querySelector('#save-as-dialog').close();
	if (uuid == null) { uuid = crypto.randomUUID(); }
	document.querySelector('#loading-modal > span').innerText = 'Saving';
	document.querySelector('#loading-modal').showModal();
	save_notebook().then(res => {
		console.log(res);
		create_notification(res.text, res.status)
		document.querySelector('#loading-modal').close();
	});
}

const show_open_dialog = () => {
	document.activeElement.blur();
	document.querySelectorAll('#open-dialog option').forEach(x => x.remove());
	document.querySelector('#open-dialog').showModal();
	list_notebooks().then(notebooks => {
		const select = document.querySelector('#open-dialog > select');
		notebooks.forEach(nb => {
			const option = document.createElement('option');
			option.value = nb.uuid;
			option.innerText = nb.notebook_name;
			select.appendChild(option);
		});
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
		uuid,
		cells,
	};
}

const save_notebook = () => {
	return new Promise(resolve => {
		if (database == null) {
			console.error('Unable to save notebook (IndexedDB is not open)');
			resolve({text: 'Save Failed', status: 'error'});
			return;
		}

		const state = serialize_state();
		if (state.notebook_name.trim().length == 0) {
			console.error('Unable to save notebook (Name cannot be blank)');
			resolve({text: 'Save Failed', status: 'error'});
			return;
		}
		if (state.uuid == null) {
			console.error('Unable to save notebook (Invalid UUID)');
			resolve({text: 'Save Failed', status: 'error'});
			return;
		}

		const req = database
			.transaction(['notebooks'], 'readwrite')
			.objectStore('notebooks')
			.put(state);
		req.onsuccess = () => resolve({text: 'Saved', status: 'success'});
		req.onerror = e => {
			console.error(`Unable to save: ${e.target.error?.message}`)
			resolve({text: 'Save Failed', status: 'error'});
		};
	});
}

const load_notebook = load_uuid => {
	console.log(load_uuid);
	const req = database
		.transaction(['notebooks'], 'readwrite')
		.objectStore('notebooks')
		.get(load_uuid);
	req.onerror = e => {
		console.error(`Unable to load: ${e.target.error?.message}`);
		create_notification('Failed Loading Notebook', 'error');
	};
	req.onsuccess = e => {
		const state = e.target.result;
		notebook_name = state.notebook_name;
		uuid = state.uuid;
		
		document.querySelectorAll('.cell').forEach(x => x.remove());

		state.cells.forEach(cell => {
			if (cell.type != 'qalc') {
				console.error(`Unknown cell type ${cell.type}`);
				return;
			}
			MQ(create_cell().querySelector('.cell-expression')).latex(cell.body);
		});
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
	uuid = null;

	document.activeElement.blur();
	document.querySelectorAll('.cell').forEach(x => x.remove());
	create_cell();
}

const initialize_database = () => {
	const set_db = db => {
		database = db;
		database.onerror = e => console.log(e.target.error?.message);
	}

	const req = window.indexedDB.open("Notebooks");
	req.onerror = e => {
		console.error(`Unable to open IndexedDB, ${e.target.error?.message}`)
		create_notification('Failed to start DB', 'error');
	};
	req.onsuccess = e => set_db(e.target.result);
	req.onupgradeneeded = e => {
		set_db(e.target.result);
		const objectStore = database.createObjectStore('notebooks', { keyPath: 'uuid' });
		objectStore.createIndex('uuid', 'uuid', { unique: true });
		objectStore.createIndex('notebook_name', 'notebook_name', { unique: false });

		objectStore.transaction.oncomplete = e => {
			console.log('IndexedDB successfully created');
		}
	}
}
initialize_database();
