'use strict';

const show_loading_modal = text => {
	document.querySelector('#loading-modal > span').innerText = text;
	document.querySelector('#loading-modal').showModal();
}

const close_loading_modal = () => {
	document.querySelector('#loading-modal').close();
}

const create_notification = (text, status) => {
	status ??= 'neutral';
	const dialog = document.createElement('div');
	dialog.classList.add(status);

	const span = document.createElement('span');
	dialog.appendChild(span);
	span.innerText = text;

	document.querySelector('#notifications').appendChild(dialog);
	setTimeout(() => dialog.remove(), 10000);
}