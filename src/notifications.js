'use strict';

const show_loading_modal = text => {
	document.querySelector('#loading-modal > span').innerText = text;
	document.querySelector('#loading-modal').showModal();
}

const close_loading_modal = () => {
	document.querySelector('#loading-modal').close();
}

const prompt_confirm = (text, buttons) => {
	buttons ??= ['Yes', 'Cancel'];
	const modal = document.querySelector('#prompt-modal');
	modal.innerText = '';

	buttons = buttons.toReversed();
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

const prompt_text = (text, opt) => {
	opt ??= {};
	opt.value ??= '';
	opt.placeholder ??= '';

	const modal = document.querySelector('#prompt-modal')
	modal.innerText = '';
	modal.showModal();

	const text_node = document.createElement('div');
	modal.appendChild(text_node);
	text_node.innerText = text;

	return new Promise((resolve, reject) => {
		const field = document.createElement('input');
		modal.appendChild(field);
		field.value = opt.value;
		field.placeholder = opt.placeholder;

		const close_listener = modal.addEventListener('close', () => {
			modal.removeEventListener('close', close_listener);
			reject();
		});

		// Float styling reverses buttons
		const cancel_button = document.createElement('button');
		modal.appendChild(cancel_button);
		cancel_button.innerText = 'Cancel';
		cancel_button.addEventListener('click', () => {
			reject();
			modal.close();
		});

		const ok_button = document.createElement('button');
		modal.appendChild(ok_button);
		ok_button.innerText = 'Ok';
		ok_button.addEventListener('click', () => {
			resolve(field.value);
			modal.close();
		});

	});
}

const prompt_math = text => {
	text ??= '';

	const modal = document.querySelector('#prompt-modal')
	modal.innerText = '';

	const text_node = document.createElement('div');
	modal.appendChild(text_node);
	text_node.innerText = text;

	return new Promise((resolve, reject) => {
		const span = document.createElement('div');
		modal.appendChild(span);
		const field = MQ.MathField(span);

		// Float styling reverses buttons
		const cancel_button = document.createElement('button');
		modal.appendChild(cancel_button);
		cancel_button.innerText = 'Cancel';
		cancel_button.addEventListener('click', () => {
			modal.close();
			reject();
		});

		const ok_button = document.createElement('button');
		modal.appendChild(ok_button);
		ok_button.innerText = 'Ok';
		ok_button.addEventListener('click', () => {
			modal.close();
			resolve(field.latex());
		});

		modal.addEventListener('close', reject);
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