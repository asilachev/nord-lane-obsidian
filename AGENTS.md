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
| `site/` | The landing page at nordlane.silachev.com: the template `index.html`, `styles.css`, `favicon.svg`, the texts in `locales/{en,es,de,ru,sr}.json` (Serbian in Cyrillic) and the screenshots in `screenshots/<lang>/`, plus the four book covers the screenshots show in `covers/` (not published on their own) |
| `scripts/build-site.mjs` | Renders `site/` into `_site/` (gitignored), once per language; fails on a missing text, a leftover placeholder or a missing file |
| `scripts/site-shots.mjs` | Takes `site/screenshots/<lang>/` from the real app: a throwaway vault per language, written from the `demo` texts in each locale, run through `tools/live/site.mjs` |
| `.github/workflows/pages.yml` | Builds the landing page on pull requests and deploys it to GitHub Pages from `master` |

## Rules

- **This repo is public.** Never commit content from anyone's real vault: notes, names, file paths, folder structures, screenshots of real notes or data. Screenshots come from `demo/` only, and new sample notes are made up.
- **Keep the theme general.** No rules that only make sense for one person's vault. A class a view needs (`nl-*`, `gc-*`) is fine if any vault could use it.
- **Build with every source change.** After editing `src/theme.src.css` or the fonts, run `python3 build.py` and commit `theme.css` and `manifest.json` in the same commit. CI fails when the committed build doesn't match the source.
- **Check visual changes in the real app** before committing: `tools/live/launch.sh`, then `node tools/live/cdp.mjs run view.mjs "<note>" source 1600 1000 <name>`, in light and dark. A layout change also needs a narrow pane and the phone emulation (`phone.mjs`). Look at the screenshot; don't trust the CSS alone.
- **Versions** follow semantic versioning: `MANIFEST["version"]` in `build.py` is the one source. A release gets a `CHANGELOG.md` entry and a `vX.Y.Z` tag.
- **The landing page** speaks five languages: English, Spanish, German, Russian and Serbian. Every text, including the sample notes its screenshots show, lives in `site/locales/<lang>.json`; add each new text to all five files, or `node scripts/build-site.mjs` fails. Its screenshots are the real app in that language: after a visible theme change or a change to the `demo` texts, run `node scripts/site-shots.mjs` (macOS, Obsidian, about eight minutes) and commit `site/screenshots/`. The sample shelf is four books, their titles, authors and covers (`site/covers/`: the publishers' artwork, from Apple Books, 450 px tall), with made-up numbers. Preview with `node scripts/build-site.mjs && python3 -m http.server -d _site`, at desktop width and at 390 px.

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
