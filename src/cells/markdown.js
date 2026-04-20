import { Editor } from 'https://esm.sh/@tiptap/core'
import StarterKit from 'https://esm.sh/@tiptap/starter-kit'

const cell_editor_map = {};

export const create_markdown_cell = element => {
	const editor = new Editor({
		element: element.querySelector('.cell-expression'),
		extensions: [StarterKit],
		content: '',
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