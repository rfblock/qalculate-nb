const toggle_theme = () => {
	const root = document.querySelector(':root')
	if (localStorage.getItem('theme') == 'dark') {
		localStorage.setItem('theme', 'light');
		root.classList.remove('dark');
	} else {
		localStorage.setItem('theme', 'dark');
		root.classList.add('dark');
	}
}

{
	let theme;
	if (localStorage.getItem('theme') == null) {
		const query = window.matchMedia('(prefers-color-scheme: dark)');
		theme = query.matches ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
	} else {
		theme = localStorage.getItem('theme');
	}
	const root = document.querySelector(':root')
	if (theme == 'dark') {
		root.classList.add('dark')
	} else {
		root.classList.remove('dark');
	}
}