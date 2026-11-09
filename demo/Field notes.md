---
aliases:
  - Field notes
tags:
  - theme
status: draft
updated: 2026-11-09
---

# Field notes

Nord Lane is a calm, wide theme on the [Nord](https://www.nordtheme.com) palette. Light mode sits on **nord6a**, a step lighter than Snow Storm, and dark mode on Polar Night. Text, tables and embeds share one column, so nothing juts out past the paragraph above it.

## This week

- [x] Move the reading list into one table
- [x] Sort the shelf by year read
- [ ] Write up the review notes
- [ ] Plan the next six weeks

> [!tip] One column
> Text, tables and Dataview output share the same edges, up to 75rem, and less on a narrow pane. On a phone, wide tables keep a readable width and scroll sideways.

## Reading log

| Book | Author | Started | Finished | Pages |
|---|---|---|---|---:|
| [[Middlemarch]] | George Eliot | 2026-09-02 | 2026-10-11 | 880 |
| [[The Peregrine]] | J. A. Baker | 2026-10-12 | 2026-10-20 | 191 |
| [[Anna Karenina]] | Leo Tolstoy | 2026-10-21 | | 864 |
| [[Walden]] | Henry David Thoreau | | | 352 |

### Кириллица

Тот же шрифт и для кириллицы: Geist с кириллическими глифами встроен в тему, поэтому iPhone и iPad показывают текст так же, как Mac.

## A small script

```js
const lane = { palette: "Nord", column: "75rem" };
console.log(`${lane.palette} lane, ${lane.column} wide`);
```

Inline `code`, a #tag, a link to [[Walden]] and a footnote.[^1]

[^1]: Footnotes use the same quiet ink as the frontmatter.
