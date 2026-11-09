// Takes the landing page's screenshots from the real app, in every language (#17):
//
//   node scripts/site-shots.mjs                 all five languages
//   node scripts/site-shots.mjs --lang ru,sr    some of them
//   node scripts/site-shots.mjs --only cards,phone-books   some shots (names as in site/screenshots/<lang>/)
//
// For each language it writes a throwaway vault (the demo vault's settings, theme and plugins,
// plus notes written from site/locales/<lang>.json → demo), starts the test Obsidian on it
// (tools/live/launch.sh), runs tools/live/site.mjs and saves site/screenshots/<lang>/*.png.
// macOS only, like the rest of tools/live; needs Obsidian and Node 22. The sample content is
// made up apart from the books: four titles, their authors and covers (site/covers/, the
// publishers' artwork from Apple Books, 450 px tall), with invented numbers.
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const live = `${root}tools/live/`
const ALL = ['en', 'es', 'de', 'ru', 'sr']
const arg = process.argv.indexOf('--lang')
const langs = arg > 0 ? process.argv[arg + 1].split(',') : ALL
const onlyArg = process.argv.indexOf('--only')
const only = onlyArg > 0 ? process.argv[onlyArg + 1] : ''
for (const code of langs) if (!ALL.includes(code)) throw new Error(`Unknown language ${code}`)

/** The shelf: titles, authors and covers; status and topic are sample data. */
const BOOKS = [
  { title: 'The Lean Startup', author: 'Eric Ries', year: 2011, status: 'done', cover: 'lean-startup' },
  { title: 'How to Win Friends and Influence People', author: 'Dale Carnegie', year: 1936, status: 'done', cover: 'how-to-win-friends' },
  { title: 'Start with No', author: 'Jim Camp', year: 2002, status: 'reading', cover: 'start-with-no' },
  { title: 'Atlas Shrugged', author: 'Ayn Rand', year: 1957, status: 'next', cover: 'atlas-shrugged' },
]
// The covers go into the vault's hidden .covers folder, so the file tree in the hero shots
// stays as it is. The notes name each one nl-cover:<name>, and tools/live/site.mjs swaps in the
// app's own URL for the file, the way a Dataview view gets one.
for (const b of BOOKS) b.src = `nl-cover:${b.cover}`

const fieldNote = (d) => {
  const f = d.field
  const rows = BOOKS.map((b, i) => `| [[${b.title}]] | ${b.author} | #${f.tags[i]} | ${b.year} |`)
  return `# ${d.files.field}

${f.intro}

## ${f.week}

- [x] ${f.tasks[0]}
- [x] ${f.tasks[1]}
- [ ] ${f.tasks[2]}
- [ ] ${f.tasks[3]}

> [!tip] ${f.callout}
> ${f.calloutText}

## ${f.list}

| ${f.book} | ${f.author} | ${f.topic} | ${f.year} |
|---|---|---|---:|
${rows.join('\n')}

### Кириллица · Ћирилица

Съешь же ещё этих мягких французских булок, да выпей чаю.

Љубазни фењерџија чађавог лица хоће да ми покаже штос.
`
}

const booksNote = (d) => {
  const b = d.books
  const corner = { reading: `<div class="gc-po">${b.reading}</div>`, done: `<div class="gc-badge gc-bl">${b.done}</div>`, next: `<div class="gc-badge gc-bl">${b.queued}</div>` }
  const cards = BOOKS.map(
    (x, i) =>
      `<div class="gc-card is-book" data-status="${x.status}"><div class="gc-cover"><img src="${x.src}" alt="">${corner[x.status]}</div>` +
      `<a class="internal-link gc-title" data-href="${x.title}">${x.title}</a><div class="gc-sub">${x.author}</div><div class="gc-meta"><span>${x.year}</span><span>#${d.field.tags[i]}</span></div></div>`,
  )
  return `---
cssclasses:
  - dashboard
---

<div class="nl-page">
<div class="nl-head nl-block"><div><div class="nl-title">${d.files.books}</div><div class="nl-sub">${b.sub}</div></div><div class="nl-controls"><div class="nl-chips"><button class="nl-chip-btn is-active">${b.all}</button><button class="nl-chip-btn">${b.read}</button><button class="nl-chip-btn">${b.next}</button></div></div></div>
<div class="nl-block"><div class="gc-grid is-books">${cards.join('')}</div></div>
</div>
`
}

const readingNote = (d) => {
  const r = d.reading
  const stats = r.stats
    .map((s) => `<div class="nl-stat"><div class="nl-stat-v">${s.v}</div><div class="nl-stat-l">${s.l}</div><div class="nl-stat-s">${s.s}</div></div>`)
    .join('')
  // 24 weeks of made-up reading days, the same in every language; the last week is still to come.
  let seed = 7
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280)
  const monthAt = { 0: 0, 4: 1, 8: 2, 13: 3, 17: 4, 21: 5 }
  const cols = Array.from({ length: 24 }, (_, w) => {
    const days = Array.from({ length: 7 }, (_, day) => {
      if (w === 23 && day > 0) return '<i class="future"></i>'
      const v = rnd() + (w / 24) * 0.35 + (day > 4 ? 0.15 : 0)
      return v < 0.45 ? '<i class="none"></i>' : `<i class="l${v < 0.75 ? 1 : v < 1 ? 2 : 3}"></i>`
    }).join('')
    const month = w in monthAt ? r.months[monthAt[w]] : ''
    // On a phone the theme drops columns marked is-old; the last 11 weeks fit.
    return `<div class="nl-hm-col${w < 13 ? ' is-old' : ''}"><span class="nl-hm-m">${month}</span>${days}</div>`
  }).join('')
  const pill = { reading: `<span class="nl-pill accent">${r.reading}</span>`, done: `<span class="nl-pill green">${r.done}</span>`, next: `<span class="nl-pill neutral">${r.next}</span>` }
  const rows = BOOKS.map(
    (x) => `<tr><td><span class="nl-cellrow"><img class="nl-thumb" src="${x.src}" alt=""><span>${x.title}</span></span></td><td>${x.author}</td><td>${pill[x.status]}</td><td class="al-r">${x.year}</td></tr>`,
  ).join('')
  const at = (year) => `${(((year - 1930) / 100) * 100).toFixed(1)}%`
  const ticks = [1930, 1950, 1970, 1990, 2010].map((y) => `<div class="nl-tl-tick" style="left: ${at(y)}">${y}</div>`).join('')
  const dots = [...BOOKS]
    .sort((a, b) => a.year - b.year)
    .map((x, i) => `<div class="nl-tl-dot" style="left: ${at(x.year)}"></div><div class="nl-tl-label${i % 2 ? ' low' : ''}" style="left: ${at(x.year)}">${x.title} · ${x.year}</div>`)
    .join('')
  return `---
cssclasses:
  - dashboard
---

<div class="nl-page">
<div class="nl-head nl-block"><div><div class="nl-title">${d.files.reading}</div><div class="nl-sub">${r.sub}</div></div><div class="nl-controls"><div class="nl-nav"><button>‹</button><span>2026</span><button>›</button></div></div></div>
<div class="nl-block"><div class="nl-stats">${stats}</div></div>
<div class="nl-block"><div class="nl-sec"><div class="nl-sec-t">${r.days}</div><div class="nl-sec-m">${r.daysMeta}</div></div><div class="nl-hm"><div class="nl-heatmap">${cols}</div><div class="nl-legend"><span>${r.less}</span><i class="none"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>${r.more}</span></div></div></div>
<div class="nl-block"><div class="nl-sec"><div class="nl-sec-t">${r.shelf}</div><div class="nl-sec-m">${r.shelfMeta}</div></div><div class="nl-tablewrap is-books"><table class="nl-table"><thead><tr><th>${r.book}</th><th>${r.author}</th><th>${r.status}</th><th class="al-r">${r.year}</th></tr></thead><tbody>${rows}</tbody></table></div></div>
<div class="nl-block"><div class="nl-sec"><div class="nl-sec-t">${r.published}</div><div class="nl-sec-m">${r.publishedMeta}</div></div><div class="nl-timeline"><div class="nl-tl-axis"></div>${ticks}<div class="nl-tl-today" style="left: 96%"></div>${dots}</div></div>
</div>
`
}

/** Something answers on the test Obsidian's DevTools port. */
const portBusy = () =>
  fetch('http://127.0.0.1:9333/json/version', { signal: AbortSignal.timeout(1000) }).then(
    () => true,
    () => false,
  )
const until = async (check, what, seconds = 40) => {
  for (let i = 0; i < seconds * 2; i++) {
    if (await check()) return
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${what}`)
}

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`)
}

for (const code of langs) {
  const d = JSON.parse(await readFile(`${root}site/locales/${code}.json`, 'utf8')).demo
  const tmp = `${tmpdir()}/nord-lane-site/${code}`
  const vault = `${tmp}/demo`
  const out = `${root}site/screenshots/${code}`
  console.log(`\n— ${code}: ${vault}`)
  await rm(tmp, { recursive: true, force: true })
  await mkdir(`${vault}/${d.files.library}`, { recursive: true })
  await mkdir(out, { recursive: true })
  // An APFS clone of the demo vault's settings, theme and plugins; a fresh workspace.
  run('cp', ['-cR', `${root}demo/.obsidian`, `${vault}/.obsidian`])
  await rm(`${vault}/.obsidian/workspace.json`, { force: true })
  await rm(`${vault}/.obsidian/workspace-mobile.json`, { force: true })
  await writeFile(`${vault}/${d.files.field}.md`, fieldNote(d))
  await writeFile(`${vault}/${d.files.books}.md`, booksNote(d))
  await writeFile(`${vault}/${d.files.reading}.md`, readingNote(d))
  for (const b of BOOKS) await writeFile(`${vault}/${d.files.library}/${b.title}.md`, `# ${b.title}\n\n${b.author}, ${b.year}.\n`)
  await mkdir(`${vault}/.covers`)
  for (const b of BOOKS) await copyFile(`${root}site/covers/${b.cover}.jpg`, `${vault}/.covers/${b.cover}.jpg`)

  const env = { ...process.env, NL_VAULT: vault, NL_DATA: `${tmp}/userdata` }
  // One test Obsidian at a time: a new one can't take the DevTools port while the last one holds it.
  await until(async () => !(await portBusy()), 'port 9333 to be free (is another tools/live Obsidian running?)')
  try {
    run(`${live}launch.sh`, [], { env })
    run('node', ['cdp.mjs', 'run', 'site.mjs', code, out, `${d.files.field}.md`, `${d.files.books}.md`, `${d.files.reading}.md`, d.field.list, only], { cwd: live })
  } finally {
    spawnSync(`${live}launch.sh`, ['stop'], { env, stdio: 'inherit' })
    await until(() => spawnSync('pgrep', ['-f', `user-data-dir=${tmp}/userdata`]).status !== 0, `the ${code} Obsidian to quit`)
  }
}
console.log(`\nsite/screenshots/: ${langs.join(', ')} done`)
