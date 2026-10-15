'use strict';

let current_step = 0;
const dialog = document.querySelector('#tutorial');
const li = dialog.querySelectorAll('#tutorial-steps > li');

const update_dialog = () => {
	dialog.querySelector('#tutorial-prev').hidden = (current_step == 0);
	dialog.querySelector('#tutorial-next').hidden = (current_step == li.length - 1);

	li.forEach(x => x.hidden = true);
	li[current_step].hidden = false;
}

window.show_tutorial = () => {
	current_step = 0;
	update_dialog();
	dialog.show();
}

dialog.querySelector('#tutorial-next').addEventListener('click', () => {
	current_step++;
	update_dialog();
});

dialog.querySelector('#tutorial-prev').addEventListener('click', () => {
	current_step--;
	update_dialog();
});