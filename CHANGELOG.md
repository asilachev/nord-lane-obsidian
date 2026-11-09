# Changelog

All notable changes to Nord Lane. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [semantic versioning](https://semver.org): `MANIFEST["version"]` in `build.py` is the one source.

## [Unreleased]

### Added

- CI checks that the committed `theme.css` and `manifest.json` match the source, and that the manifest and cover meet Obsidian's requirements.
- `AGENTS.md`: the rules for agents working in this repo.

### Fixed

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
