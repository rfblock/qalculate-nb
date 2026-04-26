'use strict';

import { Editor } from 'https://esm.sh/@tiptap/core'
import StarterKit from 'https://esm.sh/@tiptap/starter-kit'
import { Markdown } from 'https://esm.sh/@tiptap/markdown'

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

fetch('/CHANGELOG.MD').then(res => res.text().then(text => {
		new Editor({
			extensions: [ StarterKit, Markdown ],
			element: document.querySelector('#whats-new > div'),
			content: text,
			contentType: 'markdown',
			editable: false,
		});

		const latest = text.match(/## \[(.+?)]/)[1];
		set_current_version(latest);
		if (localStorage.getItem('last-viewed-version') != latest) {
			localStorage.setItem('last-viewed-version', latest);
			document.querySelector('#whats-new').showModal();
		}
	})
);