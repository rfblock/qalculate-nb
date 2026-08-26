'use strict';

import { Editor, Mark } from 'https://esm.sh/@tiptap/core'
import StarterKit from 'https://esm.sh/@tiptap/starter-kit'
import { Markdown } from 'https://esm.sh/@tiptap/markdown'

const KbdMark = Mark.create({
	name: 'kbd',
	
	parseHTML() {
		return [
			{
				tag: 'kbd',
			}
		]
	},

	renderHTML({ HTMLAttributes }) {
		return ['kbd', HTMLAttributes, 0]
	},
})

let current_version;

const latest_version_waiting_resolves = [];

export const get_version = () => new Promise(resolve => {
	if (current_version == undefined) { latest_version_waiting_resolves.push(resolve) }
	else { resolve(current_version); }
});

const set_current_version = ver => {
	current_version = ver;
	latest_version_waiting_resolves.forEach(resolve => resolve(ver));
	latest_version_waiting_resolves.length = 0;
}

fetch('/CHANGELOG.md').then(res => res.text().then(text => {
		new Editor({
			extensions: [ StarterKit, Markdown, KbdMark ],
			element: document.querySelector('#whats-new > div'),
			content: text,
			contentType: 'markdown',
			editable: false,
		});

		const latest = text.match(/## \[(.+?)]/)[1];
		set_current_version(latest);
		if (window.first_time_viewer) {
			localStorage.setItem('last-viewed-version', 'NA');
			return;
		}
		if (localStorage.getItem('last-viewed-version') != latest) {
			localStorage.setItem('last-viewed-version', latest);
			document.querySelector('#whats-new').showModal();
		}
	})
);