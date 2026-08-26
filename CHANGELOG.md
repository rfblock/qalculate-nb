# Changelog

All notable changes will be documented in this file

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project does not adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (due to a lack of public API).

## [1.0]
First major release

### Added
 - Matrices
 - Pressing enter on a markdown cell will begin editing the markdown cell
 - On screen keyboard
 - Highlighting
 - Undo deleted cell (`Edit > Undo`) or <kbd>u</kbd> in command mode
 - Plotting
   - To plot, use the function `plot(Expression or vector[, Minimum x value][, Maximum x value][, Options], ...)`
   - For a full description of `plot`, see the [Qalculate! manual pages](https://qalculate.github.io/manual/qalculate-definitions-functions.html)
 - Integrals
   - To create an integral, type `int`, `\int` or use the hamburger menu to insert an integral
   - To create a derivative d (the `d` in `dx`), press <kbd>Alt</kbd> + <kbd>d</kbd>
   - For an indefinite integral, delete the bounds with <kbd>Backspace</kbd> or <kbd>Delete</kbd>
   - For an indefinite multi-integral, type `\iint` or `\iiint`
 - Last file is automatically reopened
 - Cells undo (<kbd>z</kbd>) and redo (<kbd>Ctrl</kbd>+<kbd>y</kbd>) to undo/redo deleted/created cells.
 - Changing the contents of a cell will grey out the result until it is ran again

#### For Developers
 - Local storage variables `print_raw_mathml`, `print_mathml`, `print_qalc_expression` have been added. Set these to log parser state during various stages

### Changed
 - Cell output is saved
 - Replaced MathQuill with MathLive
 - Updated Qalculate! to 5.11.0
 - Background of Markdown cells are transparent (to better differentiate)

### Fixed
 - Console error regarding the toolbox for first-time startup

### Removed
 - Beta program warning popup

## [0.1.6]

### Added

 - Messages given by Qalculate! will appear beneath a cell (i.e. overwriting a constant)
   - Messages will not be printed when exporting to PDF
 - Variable viewer panel

### Changed

 - Qalculate! has been updated to use 5.10.0
   - For Qalculate! changes, see the [Qalculate! Website](https://qalculate.github.io/)
   - Notable changes: added `slugs`, `ppm`, `ppb`
 - `Run All` is now `Restart and Run All`
 - Boolean values will be shown as `true` or `false` instead of `1` or `0`
 - Logical operators will be shown as `and` or `or` instead of `&&` or `||`

### Fixed

- `%` in an expression no longer throws an error
- `Restart and Run All` now restarts first, then runs, instead of vice versa.

## [0.1.5]

### Changed

 - Horizontal rules (`---`) print as a page break

### Fixed

 - Table of contents clears when creating a new file
 - Unsaved changes dialog will appear when closing a file on most browsers
 - Printing no longer changes color theme temporarily

## [0.1.4]

### Added

 - Table of contents sidepanel

## [0.1.3]

### Fixed

 - Qalculate! crashing will now show a notification and restart automatically
 - Qalculate! will automatically restart when running all cells or opening/creating a new notebook

## Removed

 - `Help > Goto` (never implemented)

## [0.1.2]

### Added

 - Tutorial, `Help > Tutorial`

## [0.1.1]

### Added

 - Alt + Enter to run + insert a cell below
 - Delete, add cell buttons on hover

## [0.1.0]

Public Beta!

### Added

- Autosaving.
- Import file (`File > Import` or `ctrl + I`)
- Export file (`File > Export` or `ctrl + E`)
- Images can be pasted into markdown cells.

### Fixed

- Horizontal scrollbar appearing when going beyond one page length.

## [0.0.6]

### Added

- Inverse, Hyperbolic, Inverse Hyperbolic trig functions. (Inverse hyperbolic trig functions are written as `artanh` instead of `arctanh`)

## [0.0.5]

### Added

- Print to PDF. Printing can be done by pressing `ctrl + P` or by clicking `File > Print`. Documents can currently only be printed in light mode (attempting to print in dark mode will convert to light mode)
- Boxed cells. To box a cell, click `Cells > Box Cell`.
- `where` keyword. Expressions can be evaluated at a point (i.e. `3x+12 where x=1` evaluates to `15`)

## [0.0.4]

### Added

- Infinity (can be typed by typing `infty`)

## [0.0.3]

### Added

- Markdown cells
	- To create a markdown cell, press <kbd>m</kbd> on an empty cell
	- To create a markdown cell directly, click `Cell > Insert Markdown Cell [Above/Below]`
	- Markdown cells can be formatted as rich text
		- Text can be entered in standard markdown (i.e. `**xyz**` for bold)
		- Text can also be entered in the same manner as other text editors (i.e. `ctrl + B` for bold)

### Changed

- Creating a cell has been changed to `Cell > Insert Math Cell [Above/Below]` (from `Cell > Insert Cell [Above/Below]`)

## [0.0.2]

### Added

- This Changelog
- Toolbox (accessed by `Edit > Toolbox` or `alt + T`)
- Click to copy cell output

### Changed

- Report menu (from `File > Report` has been moved to `Help`) and was split into
	- Report a bug
	- Request a feature
	- Ask a question
- About menu has been moved to `Help`

### Fixed

- Parsing issue with multiplication of a negative number
- Parsing issue with parentheses pasted from outside source

## [0.0.1]

### Added

- Cells
- Menu
- Web Saving
- Dark mode (accessed by the `Theme` menu)
- Run all (accessed by `Cell > Run All` or `alt + R`)