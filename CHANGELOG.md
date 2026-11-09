# Changelog

All notable changes to Nord Lane. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [semantic versioning](https://semver.org): `MANIFEST["version"]` in `build.py` is the one source.

## [Unreleased]

### Added

- A website at nordlane.silachev.com in English, Spanish, German, Russian and Serbian (`site/`), built by `scripts/build-site.mjs` and deployed to GitHub Pages. Its screenshots are the real app in each language, taken by `scripts/site-shots.mjs`.
- `.gc-card.is-row`: a cover card on its side, the cover in a 72 px column and `.gc-body` beside it, for one book next to a heatmap or in a narrow column.
- CI checks that the committed `theme.css` and `manifest.json` match the source, and that the manifest and cover meet Obsidian's requirements.
- `AGENTS.md`: the rules for agents working in this repo.
- `docs/components.md` and `demo/Components.md`: the markup for the `nl-*` and `gc-*` classes, with a screenshot.
- `tools/contrast.py`: a contrast audit of the theme's text and background pairs in both modes, run in CI.
- `python3 build.py --no-fonts <vault>` installs the theme without embedded fonts (about 60 KB instead of 225), for vaults that use installed fonts. The repo's `theme.css` stays the full build.
- Style Settings support: column width, table bleed, prose measure, table text size and frontmatter size (`--nl-frontmatter-size`, new), plus a Meta-strip toggle.
- `cssclasses: [prose]`: an opt-in reading measure (`--nl-prose-max`, 46rem) for paragraphs, lists, headings and quotes, while tables, code, callouts and embeds keep the full column.

### Changed

- Properties in reading view follow Obsidian's "Properties in document" setting instead of always being hidden. They're set quietly, 13 px with monospace keys. `cssclasses: [hide-properties]` hides them for one note, and notes with `cssclasses: [dashboard]` hide them too. The Add property button stays out of reading view.

- Colours meet WCAG AA everywhere text sits on them. Light mode: callout titles, the green and amber tones, the accent fill behind badges, and the darkest heat shade are a step darker. Dark mode: the error and question callouts and faint text are a step lighter, and the middle heat shade is lighter, with dark text. New `--nl-on-heat-1/2/3` tokens set the text colour on each heat shade.

- Cover-card filters are generic. A view hides the cards that don't match by setting the `hidden` attribute, and the theme hides `.gc-card[hidden]`. The four rules that matched particular `data-filter` values are gone, so a view that relied on them must now set `hidden`.

- The Properties view is set the same way in Live Preview, when properties are visible rather than shown as source: frontmatter-size text, monospace keys, muted, hairline dividers and a Nord hover.
- The `## Meta` strip in reading view is opt-in: Style Settings, Nord Lane, Meta strip (it adds `nl-meta-strip` to the body). It was keyed on the heading's text and applied to every vault.
- The added Snow Storm step `#F6F7FA` is called nord6a (it was nord6.5) in the README, the CSS comments and the demo vault, to match the other `nordX` names.
- Headings step down from H2 to the text: H3 is 1.125em (18 px at the default 16), up from 1.03em, so it no longer reads as a bold line; H4 is the text's size (it was 0.95em, smaller than the text it heads); H5 and H6 are 0.875em.
- Book covers in cards and in `.nl-tablewrap.is-books` tables have a hairline (`--nl-hair`), so a white cover doesn't melt into a light card.
- The README leads with screenshots: the same note in light and dark, the palette, the one-column layout, the phone layout and the component classes. The demo's Cyrillic section shows Russian and Serbian.

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
