# Changelog

All notable changes will be documented in this file

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project does not adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (due to a lack of public API).

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
	- To create a markdown cell, press `m` on an empty cell
	- To create a markdown cell directly, click `Cell > Insert Markdown Cell [Above/Below]`
	- Markdown cells can be formated as rich text
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