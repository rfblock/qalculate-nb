document.querySelectorAll('menu > div > div > div > button').forEach(x => x.addEventListener('click', () => {
	document.activeElement.blur();
}));

create_cell();
unsaved_changes = false;