import { Editor } from 'https://esm.sh/@tiptap/core'
import StarterKit from 'https://esm.sh/@tiptap/starter-kit'

const cell_editor_map = {};

export const create_markdown_cell = element => {
	const editor = new Editor({
		element: element.querySelector('.cell-expression'),
		extensions: [StarterKit],
		content: '',
	});

	cell_editor_map[element] = editor;
	return editor;
}

export const get_markdown_cell_value = element => {
	return cell_editor_map[element]?.getJSON();
}

export const set_markdown_cell = (element, value) => {
	cell_editor_map[element]?.commands?.setContent(value);
}

export const delete_markdown_editors = () => {
	Object.keys(cell_editor_map).forEach(x => {
		delete cell_editor_map[x];
	});
}