#!/bin/bash
# After python3 build.py <vault>: make the running test instance pick up the new theme.css.
cd "$(dirname "$0")" && node cdp.mjs eval '(app.customCss.setTheme(""), app.customCss.setTheme("Nord Lane"), "theme reloaded")'
