'use strict';

const show_loading_modal = text => {
	document.querySelector('#loading-modal > span').innerText = text;
	document.querySelector('#loading-modal').showModal();
}

const close_loading_modal = () => {
	document.querySelector('#loading-modal').close();
}

const prompt_modal = (text, buttons) => {
	buttons ??= ['Yes', 'Cancel'];
	document.querySelectorAll('#prompt-modal > *').forEach(x => x.remove());
	const modal = document.querySelector('#prompt-modal');

	const text_node = document.createElement('div');
	modal.appendChild(text_node);
	text_node.innerText = text;

	return new Promise((resolve, reject) => {
		const button_wrapper = document.createElement('div');
		modal.appendChild(button_wrapper);
		buttons.forEach(label => {
			const button = document.createElement('button');
			button_wrapper.appendChild(button);
			button.innerText = label;
			button.addEventListener('click', () => {
				resolve(label);
				modal.close();
			});
		});
		modal.addEventListener('close', () => reject());
		modal.showModal();
	});
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