'use strict';

import { MathfieldElement, MathDivElement, MathSpanElement } from 'https://esm.run/mathlive';

MathfieldElement.fontsDirectory = 'https://cdn.jsdelivr.net/npm/mathlive/fonts';
MathfieldElement.soundsDirectory = null;

export const new_math_field = () => {
	const field = new MathfieldElement();
	field.mathModeSpace = '\\,';
	field.defaultMode = 'math';

	field.addEventListener('mount', () => {
		const unit = (x, sym) => ({[x]: `\\operatorname{${sym ?? x}}` });
		const fcn = x => ({[x]: `\\operatorname{${x}}`});
		field.inlineShortcuts = {
			...field.inlineShortcuts,

			// Trig/Hyp-trig
			...fcn('arccot'),
			...fcn('csch'),
			...fcn('arsech'),
			...fcn('arcsch'),
			...fcn('arcoth'),

			// Solving
			...fcn('plot'),
			...fcn('solve'),
			...fcn('solve2'),
			...fcn('multisolve'),
			...fcn('newtonsolve'),

			// Calculus
			...fcn('diff'),
			...fcn('Ci'),
			...fcn('Ei'),
			...fcn('fresnelc'),
			...fcn('fresnels'),
			...fcn('Chi'),
			...fcn('Shi'),
			...fcn('Si'),

			// TODO: Binomial, 

			...unit('oF', '\\degree F'),
			...unit('oC', '\\degree C'),

			// Symbols
			'to': '\\to',
			'of': '',

			// Units
			
			...unit('in'),
			...unit('inches'),
			...unit('ft'),
			...unit('lbf'),

			...unit('Btu'),

			...unit('kJ'),
			...unit('MJ'),

			...unit('ohm', '\\Omega'),
			...unit('ohms', '\\Omega'),
		};
	});

	return field;
}

export const new_math_div = () => new MathDivElement();
export const new_math_span = () => new MathSpanElement();

export const qalc_to_latex = qalc => {
	// special rendering functions:
	//   sqrt
	//   cbrt
	//   root
	//   log2
	//   log10
	//   log(x, b)
	//   integrate
	// functions
	// fractions
	// matrices

	let latex = '';

	while (qalc.length > 0) {
		const fcn_re = /^([a-zA-Z0-9]+)/;
		const fcn = qalc.match(fcn_re);
	}
}