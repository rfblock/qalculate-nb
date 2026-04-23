'use strict';

window.addEventListener('beforeprint', () => {
	document.querySelector(':root').classList.add('print');
});

window.addEventListener('afterprint', () => {
	document.querySelector(':root').classList.remove('print');
});