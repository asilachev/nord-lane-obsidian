// Assembles the landing page into _site/, once per language (#17):
//
//   _site/index.html          English, from the template site/index.html and site/locales/en.json
//   _site/{es,de,ru,sr}/      the other languages
//   _site/screenshots/<lang>/ the real app in that language, from site/screenshots/<lang>/
//                             (node scripts/site-shots.mjs takes them)
//   _site/fonts/, fonts.css   Geist and Geist Mono, from src/fonts/
//   _site/theme.css, manifest.json   the theme itself, for the download buttons
//
//   node scripts/build-site.mjs     then preview with: python3 -m http.server -d _site
//
// Fails if a language misses a text, the page references a file that isn't there, or a
// placeholder is left over. Needs Node 22 or later and nothing else.
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = `${root}_site/`
const SITE_URL = 'https://nordlane.silachev.com/'
const STORAGE_KEY = 'nordlane-site:lang'
const REPO = 'https://github.com/asilachev/nord-lane-obsidian'

/** The page's languages; English lives at the root. */
const LANGS = [
  { code: 'en', name: 'English', tag: 'en', locale: 'en_GB' },
  { code: 'es', name: 'Español', tag: 'es', locale: 'es_ES' },
  { code: 'de', name: 'Deutsch', tag: 'de', locale: 'de_DE' },
  { code: 'ru', name: 'Русский', tag: 'ru', locale: 'ru_RU' },
  { code: 'sr', name: 'Српски', tag: 'sr-Cyrl', locale: 'sr_RS' },
]
const dirOf = (code) => (code === 'en' ? '' : `${code}/`)

const links = (base) => ({
  github: REPO,
  readme: REPO,
  issues: `${REPO}/issues`,
  changelog: `${REPO}/blob/master/CHANGELOG.md`,
  license: `${REPO}/blob/master/LICENSE`,
  components: `${REPO}/blob/master/docs/components.md`,
  theme: `${base}theme.css`,
  manifest: `${base}manifest.json`,
})

/** First visit to the English page: go to the browser's language, unless one was picked here. */
const REDIRECT = `<script>
      ;(() => {
        const others = ${JSON.stringify(LANGS.map((l) => l.code).filter((c) => c !== 'en'))}
        const go = (code) => location.replace(\`\${code}/\${location.hash}\`)
        try {
          const picked = localStorage.getItem('${STORAGE_KEY}')
          if (picked) {
            if (others.includes(picked)) go(picked)
            return
          }
        } catch {
          // No storage: fall back to the browser's languages.
        }
        for (const tag of navigator.languages ?? [navigator.language]) {
          const code = String(tag).toLowerCase().split('-')[0]
          if (code === 'en') return
          if (others.includes(code)) return go(code)
        }
      })()
    </script>`

// ---- Texts ---------------------------------------------------------------------------------------

/** Every text in a locale file, by dotted path. */
function flatten(value, path = '', into = new Map()) {
  if (typeof value === 'string') into.set(path, value)
  else if (Array.isArray(value)) value.forEach((v, i) => flatten(v, `${path}.${i}`, into))
  else for (const [k, v] of Object.entries(value)) flatten(v, path ? `${path}.${k}` : k, into)
  return into
}
const texts = Object.fromEntries(
  await Promise.all(
    LANGS.map(async ({ code }) => [
      code,
      flatten(JSON.parse(await readFile(`${root}site/locales/${code}.json`, 'utf8'))),
    ]),
  ),
)
const problems = []
for (const { code } of LANGS) {
  const missing = [...texts.en.keys()].filter((k) => !texts[code].has(k))
  const extra = [...texts[code].keys()].filter((k) => !texts.en.has(k))
  if (missing.length) problems.push(`site/locales/${code}.json misses ${missing.join(', ')}`)
  if (extra.length) problems.push(`site/locales/${code}.json has unknown ${extra.join(', ')}`)
}

// ---- Pages ---------------------------------------------------------------------------------------

const escapeAttribute = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

/** Fills {{key}}: inside a tag the value is attribute text; elsewhere it's (trusted) HTML. */
function render(template, value) {
  let html = template.replace(/<!--[\s\S]*?-->\n?/g, '')
  const fill = (escape) => (_, key) => (escape ? escapeAttribute(value(key)) : value(key))
  for (let pass = 0; pass < 3 && html.includes('{{'); pass++) {
    html = html.replace(/<[^<>]*>/g, (tag) => tag.replace(/\{\{([\w.]+)\}\}/g, fill(true)))
    html = html.replace(/\{\{([\w.]+)\}\}/g, fill(false))
  }
  const left = html.match(/\{\{[^}]*\}\}/)
  if (left) throw new Error(`Unknown placeholder ${left[0]}`)
  return html
}

const manifest = JSON.parse(await readFile(`${root}manifest.json`, 'utf8'))

function page(template, lang) {
  const { code, tag, name, locale } = lang
  const base = code === 'en' ? '' : '../'
  // The same links serve the chips (codes) and the narrow-screen menu (names); CSS shows each
  // part where it sits.
  const link = (other) =>
    `<li><a href="${base}${dirOf(other.code) || './'}" hreflang="${other.tag}" lang="${other.tag}" ` +
    `data-lang="${other.code}"${other.code === code ? ' aria-current="page"' : ''}>` +
    `<span class="code">${other.code}</span><span class="name">${other.name}</span></a></li>`
  const languageLinks = LANGS.map(link).join('\n            ')
  const generated = {
    lang: tag,
    code,
    langName: name,
    langCode: code.toUpperCase(),
    base,
    shots: `${base}screenshots/${code}/`,
    siteUrl: SITE_URL,
    pageUrl: SITE_URL + dirOf(code),
    ogLocale: locale,
    alternates: [
      ...LANGS.map(
        (l) => `<link rel="alternate" hreflang="${l.tag}" href="${SITE_URL}${dirOf(l.code)}" />`,
      ),
      `<link rel="alternate" hreflang="x-default" href="${SITE_URL}" />`,
    ].join('\n    '),
    langMenu: languageLinks,
    langChips: languageLinks,
    redirect: code === 'en' ? REDIRECT : '',
    storageKey: STORAGE_KEY,
    version: manifest.version,
    cssVersion,
    ...Object.fromEntries(Object.entries(links(base)).map(([k, v]) => [`links.${k}`, v])),
  }
  return render(template, (key) => {
    if (key in generated) return generated[key]
    const text = texts[code].get(key)
    if (text === undefined) throw new Error(`site/locales/${code}.json has no text for ${key}`)
    return text
  })
}

// ---- Files ---------------------------------------------------------------------------------------

const template = await readFile(`${root}site/index.html`, 'utf8')
/** The screenshots the template shows. */
const shots = [...new Set([...template.matchAll(/\{\{shots\}\}([\w-]+\.png)/g)].map((m) => m[1]))]

// The fonts the theme embeds, as files: one @font-face per subset, from src/fonts/manifest.txt.
const faces = (await readFile(`${root}src/fonts/manifest.txt`, 'utf8'))
  .trim()
  .split('\n')
  .map((line) => {
    const [family, subset, file, range] = line.split('\t')
    return (
      `/* ${family}, ${subset} */\n@font-face {\n  font-family: '${family}';\n  font-style: normal;\n` +
      `  font-weight: 100 900;\n  font-display: swap;\n  src: url('fonts/${file}') format('woff2');\n` +
      `  unicode-range: ${range};\n}\n`
    )
  })
const fontsCss = `/* Geist and Geist Mono (SIL Open Font License 1.1), the subsets the theme embeds. */\n\n${faces.join('\n')}`

// Pages may serve a cached stylesheet for 10 minutes; a URL that changes with its content makes a
// deploy load the matching CSS at once.
const cssVersion = createHash('sha256')
  .update(await readFile(`${root}site/styles.css`))
  .update(fontsCss)
  .digest('hex')
  .slice(0, 10)

await rm(out, { recursive: true, force: true })
await mkdir(`${out}fonts`, { recursive: true })
await cp(`${root}site/styles.css`, `${out}styles.css`)
await cp(`${root}site/favicon.svg`, `${out}favicon.svg`)
await writeFile(`${out}fonts.css`, fontsCss)
for (const file of await readdir(`${root}src/fonts`)) {
  if (file.endsWith('.woff2')) await cp(`${root}src/fonts/${file}`, `${out}fonts/${file}`)
}
await cp(`${root}src/fonts/OFL.txt`, `${out}fonts/OFL.txt`)
await cp(`${root}theme.css`, `${out}theme.css`)
await cp(`${root}manifest.json`, `${out}manifest.json`)

for (const lang of LANGS) {
  await mkdir(`${out}screenshots/${lang.code}`, { recursive: true })
  for (const shot of shots) {
    try {
      await cp(`${root}site/screenshots/${lang.code}/${shot}`, `${out}screenshots/${lang.code}/${shot}`)
    } catch {
      problems.push(`No ${lang.code} screenshot ${shot}: run node scripts/site-shots.mjs --lang ${lang.code}`)
    }
  }
  await mkdir(`${out}${dirOf(lang.code)}`, { recursive: true })
  await writeFile(`${out}${dirOf(lang.code)}index.html`, page(template, lang))
}

// Every local file a page or a stylesheet points at must exist.
let checked = 0
const check = async (file, ref) => {
  const target = new URL(ref.split('?')[0], `file://${file}`)
  checked++
  try {
    await stat(fileURLToPath(target))
  } catch {
    problems.push(`${file.slice(out.length)} points at missing ${ref}`)
  }
}
for (const lang of LANGS) {
  const file = `${out}${dirOf(lang.code)}index.html`
  const html = await readFile(file, 'utf8')
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) await check(file, ref)
}
for (const sheet of ['styles.css', 'fonts.css']) {
  const css = await readFile(`${out}${sheet}`, 'utf8')
  for (const [, ref] of css.matchAll(/url\('([^')]+)'\)/g)) await check(`${out}${sheet}`, ref)
}

if (problems.length) {
  for (const problem of problems) console.error(`✗ ${problem}`)
  process.exit(1)
}
console.log(`_site/ ready: ${LANGS.length} languages, ${checked} local references, all present`)
