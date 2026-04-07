'use strict';

let formulas;

on_database_load(() => list_formulas().then(formula_list => {
	formulas = { All: [] };
	formula_list.forEach(formula => {
		if (!Object.keys(formulas).includes(formula.category)) {
			formulas[formula.category] = [];
		}

		formulas[formula.category].push(formula);
	});
}));

const render_formula_list = category => {
	const list_element = document.querySelector('#toolbox-entry-list');
	list_element.innerText = '';

	const formula_list = category == 'All'
		? Object.values(formulas).flat(1)
		: formulas[category];

	formula_list.forEach(eq => {
		const li = document.createElement('li');
		list_element.appendChild(li);
		
		const span = document.createElement('span');
		li.appendChild(span);

		const field = MQ.StaticMath(span);
		field.latex(eq.latex);
		
		span.addEventListener('click', () => {
			navigator.clipboard.writeText(field.latex());
			create_notification('Copied');
			document.querySelector('#toolbox-dialog').close();
		});
	});
}

let selected_toolbox_category = 'All';

const render_category_list = () => {
	const category_list = document.querySelector('#toolbox-category-list');
	category_list.innerText = '';

	Object.keys(formulas).forEach(category => {
		if (category == selected_toolbox_category) {
			render_formula_list(category);
		}

		const category_button = document.createElement('button');
		category_list.appendChild(category_button);
		category_button.innerText = category;
		category_button.addEventListener('click', () => {
			selected_toolbox_category = category;
			render_formula_list(category);
		});
	});
}

const action_toolbox = () => {
	document.querySelectorAll('dialog').forEach(x => x.close());

	const toolbox_dialog = document.querySelector('#toolbox-dialog');
	toolbox_dialog.showModal();

	render_category_list();
}

const toolbox_new_category = () => {
	prompt_text('Category Name')
		.then(category => {
			if (Object.keys(formulas).includes(category)) {
				create_notification('Category already exists', 'error');
			} else {
				formulas[category] = [];
			}
			render_category_list();
		})
		.catch(() => {});
};

const toolbox_new_formula = () => {
	prompt_math('')
		.then(latex => {
			if (latex == '') { return; }
			// FIXME: Cannot close/open a prompt on the same frame
			requestAnimationFrame(() => {
				prompt_text('', { placeholder: 'Formula Name' })
				.then(name => {
					debugger;
					name ??= '';
					save_formula(latex, name, selected_toolbox_category);
					formulas[selected_toolbox_category].push({
						latex,
						name,
						selected_toolbox_category,
					});
					render_formula_list(selected_toolbox_category);
				});
			});
		})
		.catch(() => {});
};