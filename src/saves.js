'use strict';

let notebook_name = '';
let uuid = null;

/**
 * @type {IDBDatabase | null}
 */
let database = null;

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
	if (database == null) {
		console.error('Unable to save notebook (IndexedDB is not open)');
		return;
	}

	const state = serialize_state();
	if (state.notebook_name.trim().length == 0) {
		console.error('Unable to save notebook (Name cannot be blank)');
		return;
	}
	if (state.uuid == null) {
		console.error('Unable to save notebook (Invalid UUID)');
		return;
	}

	const req = database
		.transaction(['notebooks'], 'readwrite')
		.objectStore('notebooks')
		.put(state);
	// TODO: These should be modals/popups
	req.onsuccess = () => console.log('Saved successfully');
	req.onerror = e => console.error(`Unable to save: ${e.target.error?.message}`);
}

const load_notebook = load_uuid => {
	const req = database
		.transaction(['notebooks'], 'readwrite')
		.objectStore('notebooks')
		.get(load_uuid);
	req.onerror = e => console.error(`Unable to load: ${e.target.error?.message}`);
	req.onsuccess = e => {
		const state = e.target.result;
		notebook_name = state.notebook_name;
		uuid = state.uuid;
		
		document.querySelectorAll('.cell').forEach(x => x.remove());

		state.cells.forEach(cell => {
			if (cell.type != 'qalc') {
				console.log(`Unknown cell type ${cell.type}`);
				return;
			}
			MQ(create_cell().querySelector('.cell-expression')).latex(cell.body);
		});
	}
}

const new_notebook = () => {
	notebook_name = '';
	uuid = null;

	document.querySelectorAll('.cell').forEach(x => x.remove());
	create_cell();
}

const initialize_database = () => {
	const set_db = db => {
		database = db;
		database.onerror = e => console.log(e.target.error?.message);
	}

	const req = window.indexedDB.open("Notebooks");
	req.onerror = e => console.error(`Unable to open IndexedDB, ${e.target.error?.message}`);
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
