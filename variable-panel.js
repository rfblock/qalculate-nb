'use strict';

import { get_variables } from './calculator.js'

export const relist_variables = () => {
	const panel = document.querySelector('#variable-panel > table > tbody');
	panel.textContent = '';

	get_variables().forEach(v => {
		const tr = document.createElement('tr');
		panel.appendChild(tr);

		const td_name = document.createElement('td');
		tr.appendChild(td_name);
		td_name.textContent = v.name;

		const td_value = document.createElement('td');
		tr.appendChild(td_value);
		td_value.textContent = v.value;
	});
}