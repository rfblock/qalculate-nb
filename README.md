# Qalculate-NB

This is a jupyter notebook-like environment for Qalculate!

Currently supports units, arithmetic operations, basic functions, and saved variables

## Usage

`make -j$(nproc) serve`

Currently only tested on a Linux system with all the standard development
tools, but it should work anywhere that has bash, aria2c, and python3.
Everything else will be fetched in a hopefully reproducible manner.

Once everything is built, a website will be hosted at http://localhost:8000
with the built program.
