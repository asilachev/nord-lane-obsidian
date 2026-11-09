# Changelog

All notable changes to Nord Lane. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [semantic versioning](https://semver.org): `MANIFEST["version"]` in `build.py` is the one source.

## [Unreleased]

### Added

- CI checks that the committed `theme.css` and `manifest.json` match the source, and that the manifest and cover meet Obsidian's requirements.
- `AGENTS.md`: the rules for agents working in this repo.

### Changed

- Properties in reading view follow Obsidian's "Properties in document" setting instead of always being hidden. They're set quietly, 13 px with monospace keys. `cssclasses: [hide-properties]` hides them for one note, and notes with `cssclasses: [dashboard]` hide them too. The Add property button stays out of reading view.

### Removed

- The `show_properties` and `show_add_property_btn` classes. Properties show by Obsidian's setting now, so opting in is no longer needed.

### Fixed

- The live harness keeps working when its window is behind others, because background throttling is off and every wait runs in Node. It handles several notes per phone run, opening notes with `openLinkText`, which works in mobile emulation. Phone screenshots are taken screen by screen, since full-height captures came out blank in mobile mode. `open.mjs`, which duplicated `view.mjs`, is gone.
- Callout titles and icons take their type's Nord colour again (Obsidian 1.15 reads `--callout-color` as a whole colour), and the tint behind each callout is a little stronger, so a warning no longer looks like a note.

## [1.0.0] - 2026-11-09

### Added

- **Colours:** Nord palette themes. Light mode puts every background on nord6.5 (`#F6F7FA`) with nord4 hairlines; dark mode is Polar Night.
- **One column:** text, tables, Dataview output and embeds share it, up to 75rem (`--nl-col-max`, with `--nl-bleed` to let data hang past the text).
- **One table style** for markdown, Dataview and the Live Preview table editor: 15 px, or 14 px in panes under 700 px. Dataview's `-` placeholders show as a dash.
- **Fonts:** Geist and Geist Mono embedded, Latin and Cyrillic.
- **Frontmatter:** set in 13 px muted monospace when properties are shown as YAML source.
- **Calendar plugin:** restyled as a heat calendar.
- **Layout:** container queries on the note pane for phones and narrow panes.
- **Dashboards:** `nl-*` classes for dataviewjs dashboards and `gc-*` cover cards.
- **Tooling:** the `demo/` sample vault, and `tools/live` for checking the theme in the real app.

[Unreleased]: https://github.com/asilachev/nord-lane-obsidian/compare/fcda86e...HEAD
[1.0.0]: https://github.com/asilachev/nord-lane-obsidian/commit/fcda86e
