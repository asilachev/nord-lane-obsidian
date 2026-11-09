# Nord Lane: rules for agents

Nord Lane is an Obsidian theme on the Nord palette. This file applies to every agent working in this repo (Claude Code, Codex, Cursor or any other). `CLAUDE.md` only imports it.

## Layout

| Path | What |
|---|---|
| `src/theme.src.css` | The theme. Edit this file. |
| `src/fonts/` | Geist and Geist Mono subsets (woff2), `manifest.txt` listing them, `OFL.txt`, their license |
| `build.py` | Embeds the fonts and writes `theme.css` and `manifest.json` at the root; vault paths given as arguments get the theme installed too |
| `theme.css`, `manifest.json` | Build output, committed, because Obsidian installs these two files from the default branch. Never edit them by hand. |
| `cover.png` | The 512×288 screenshot Obsidian's theme browser shows |
| `screenshots/` | README images, taken from `demo/` |
| `demo/` | A vault of made-up sample notes for checks and screenshots |
| `tools/live/` | Drives a separate Obsidian over the DevTools protocol: screenshots, CSS inspection, phone emulation |

## Rules

- **This repo is public.** Never commit content from anyone's real vault: notes, names, file paths, folder structures, screenshots of real notes or data. Screenshots come from `demo/` only, and new sample notes are made up.
- **Keep the theme general.** No rules that only make sense for one person's vault. A class a view needs (`nl-*`, `gc-*`) is fine if any vault could use it.
- **Build with every source change.** After editing `src/theme.src.css` or the fonts, run `python3 build.py` and commit `theme.css` and `manifest.json` in the same commit. CI fails when the committed build doesn't match the source.
- **Check visual changes in the real app** before committing: `tools/live/launch.sh`, then `node tools/live/cdp.mjs run view.mjs "<note>" source 1600 1000 <name>`, in light and dark. A layout change also needs a narrow pane and the phone emulation (`phone.mjs`). Look at the screenshot; don't trust the CSS alone.
- **Versions** follow semantic versioning: `MANIFEST["version"]` in `build.py` is the one source. A release gets a `CHANGELOG.md` entry and a `vX.Y.Z` tag.

## Commits

- **Conventional Commits:** `type(scope): summary`.
  - **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
  - **Scope:** optional, the part touched, such as `tables`, `callouts`, `calendar`, `fonts`, `tools`, `build`, `readme`.
  - **Summary:** imperative mood, lower case, no final period, at most 72 characters.
  - **Body:** says why, wrapped at 72 characters.
  - **Issues:** `Closes #N` in the body, so the commit closes the issue it fixes.
- **No AI attribution, anywhere.** Commits, pull requests, issues and comments carry no `Co-Authored-By:` trailer for Claude or any other agent, and no "Generated with …" line. The repo owner is the author of record.
- **Branch:** `master`. Keep commits small and focused, one change and its build per commit.

## Work

Work is tracked in GitHub issues. Pick one, do it, check it in the app, and close it from the commit. Anything found along the way and not fixed right away becomes a new issue rather than a TODO in the code.
