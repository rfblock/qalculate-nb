# Contributing

This document outlines setting up the repository and pushing to the dev branch.

## TL;DR

1. [Find an issue](https://github.com/rfblock/qalculate-nb/issues?q=sort:updated-desc+is:issue+state:open+)
2. [Fork the repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)
3. [Clone the fork](https://github.com/git-guides/git-clone)
4. Switch to the `dev` branch (run `git checkout dev`)
5. Build (run `make`)
6. Make desired changes
7. Push changes to your fork
8. [Create a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)

Don't use AI generate code (for legal reasons).

## Finding issues

It is a good idea to find an [issue/feature request](https://github.com/rfblock/qalculate-nb/issues?q=sort%3Aupdated-desc+is%3Aissue+state%3Aopen+) before working on code. This prevents two issues
 - Working on a problem that someone else is already working on
 - Working on a feature that may not be accepted

Looking at the issues page also allows you too see what issues are considered "high priority", as well as possible good first issues.

Once you've found an issue to work on, leave a comment acknowledging your ownership under the issue. This way, the maintainer can mark you as the assignee, preventing duplicate work.

If you want to add a feature, but no issue has been created, you should create an issue first. Communication with the maintainer is important, as they can give you feedback on the feature and possible interactions/conflicts it would have with the rest of the codebase. Creating an issue for the feature first also allows for assignments, again preventing duplicate work.

## LEGAL WARNING FOR AI CODE

This project is licensed under GPLv2, which requires all contributors to own the copyright of their own code. Due to the nature of AI generated code, [it is hard to say who the copyright holder is, if any](https://www.bloomberglaw.com/external/document/X4H9CFB4000000/copyrights-professional-perspective-ip-issues-with-ai-code-gener). Because of this, AI generated code is **forbidden**. This includes any form of text (code, comments, documentation, wiki pages) as well as assets (images, video, sounds). Note that this only applies to generated text/assets. Other AI-based tools, such as debuggers/analyzers, may be used under your discretion.

**tl;dr**: I am not a lawyer. I don't want to deal with the legal implications of AI generated code. Please don't contribute AI generated code.

## Setting up a local copy

If you plan on uploading changes (via pull request), you'll likely need to [fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) the repository first. Once a fork has been created, you can then [clone your fork](https://github.com/git-guides/git-clone).

By default, `git` will pull the `master` branch. This is the branch that gets deployed to `qalc.steg.gy`. However, developer contributions happen on the `dev` branch, which is deployed to `dev.qalc.steg.gy`. To switch to the right branch, run `git checkout dev` in the root directory of the repository.

### Advanced: Create a branch

If you plan on working on multiple issues simultaneously, it may be a good idea to create a branch to work on each issue simultaneously. To create a branch, first ensure you are starting on the `dev` branch (`git checkout dev`). Next, create a branch with the name of the issue, such as `git branch feature/gnuplot`.

To switch to your branch, run `git checkout <branch>` where `<branch>` is the name of the branch you want to switch to. To list branches, run `git branch`.

### First time build

This repository is made only for Linux. If you are on Windows, it is a good idea to get familiar with [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/install). To start, run `wsl` to begin a Linux environment.

Install the required dependencies with `sudo apt install libtool-bin intltool autoconf-archive make`, then build with `make -j$(nproc) deploy`. The first build can take anywhere from 5-20 minutes, depending on your machine.

## Making changes

At this point, you can now make changes to the source files. Note that the source tree is flattened during building, so directories are for grouping only (for example, `src/cells/test.js` will interfere with `src/test.js`).

To test your changes, run `make`. This will deploy a webserver, making a website accessible at `http://localhost:8000/`. If more changes are needed, save your files and re-run `make` (use <kbd>Ctrl</kbd>+<kbd>c</kbd> to stop the current instance).

Be sure to document and test your changes. Documentation includes the `CHANGELOG.md` file and comments with-in the source code.

Once you are happy with your changes, you can [commit your changes](https://github.com/git-guides/git-commit) and [push](https://github.com/git-guides/git-push) them to your fork.

Finally, you can create a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) from your fork to the `dev` branch. Note that you can have as many commits as you'd like, but should limit yourself to one pull request per issue.

Once the pull request is submitted, it will be reviewed by one or more people, including the maintainer. If the review is successful, the changes will be merged into the dev branch and the changes will be included in the next version. If something comes up during review, the maintainer will make a comment requesting changes, as well as providing any guidance needed.