import { Editor } from 'https://esm.sh/@tiptap/core'
import StarterKit from 'https://esm.sh/@tiptap/starter-kit'

const create_markdown_cell = element => {
	return new Editor({
		element: document.querySelector('.element'),
		extensions: [StarterKit],
		content: '<p>Hello from CDN!</p>',
	});
}