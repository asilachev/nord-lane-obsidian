#!/bin/bash
# After python3 build.py <vault>: make the running test instance pick up the new theme.css.
cd "$(dirname "$0")" && node cdp.mjs eval '(async () => { app.customCss.setTheme(""); await new Promise(r => setTimeout(r, 300)); app.customCss.setTheme("Nord Lane"); return "theme reloaded"; })()'
