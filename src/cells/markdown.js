import { set_unsaved_changes } from './saves.js'

import { Editor } from 'https://esm.sh/@tiptap/core'
import StarterKit from 'https://esm.sh/@tiptap/starter-kit'
import Image from 'https://esm.sh/@tiptap/extension-image'
import FileHandler from 'https://esm.sh/@tiptap/extension-file-handler'

const cell_editor_map = {};

export const create_markdown_cell = element => {
	const editor = new Editor({
		element: element.querySelector('.cell-expression'),
		extensions: [
			StarterKit,
			Image,
			FileHandler.configure({
				allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
				onDrop: (currentEditor, files, pos) => {
					files.forEach(file => {
						const fileReader = new FileReader();
						
						fileReader.readAsDataURL(file);
						fileReader.onload = () => {
						currentEditor
							.chain()
							.insertContentAt(pos, {
								type: 'image',
								attrs: {
									src: fileReader.result,
								},
							})
							.focus()
							.run()
						}
					})
				},
				onPaste: (currentEditor, files, htmlContent) => {
					files.forEach(file => {
						if (htmlContent) { return false; }

						const fileReader = new FileReader();

						fileReader.readAsDataURL(file);
						fileReader.onload = () => {
							currentEditor
								.chain()
								.insertContentAt(currentEditor.state.selection.anchor, {
									type: 'image',
									attrs: {
										src: fileReader.result,
									},
								})
								.focus()
								.run();
						}
					});
				}
			})
		],
		content: '',
		onUpdate: () => set_unsaved_changes(),
	});

	element.id = Math.random().toString(36).slice(2);
	cell_editor_map[element.id] = editor;
	return editor;
}

export const get_markdown_cell_value = element => {
	return cell_editor_map[element.id]?.getJSON();
}

export const set_markdown_cell_content = (element, value) => {
	cell_editor_map[element.id]?.commands?.setContent(value);
}

export const delete_markdown_editors = () => {
	Object.keys(cell_editor_map).forEach(x => {
		delete cell_editor_map[x];
	});
}