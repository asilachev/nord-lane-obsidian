#!/usr/bin/env python3
"""Build Nord Lane: embed the Geist fonts into src/theme.src.css and write theme.css and
manifest.json at the repo root, which is what Obsidian installs. Vault paths given as
arguments get the theme installed too.

    python3 build.py                     theme.css and manifest.json here
    python3 build.py ~/vault [~/other]   ...and into each vault's .obsidian/themes/Nord Lane/
    python3 build.py --no-fonts ~/vault  a vault gets the theme without embedded fonts (about
                                         60 KB instead of 225); the repo's theme.css stays full

The fonts are Google Fonts subsets (latin, latin-ext, cyrillic, cyrillic-ext) of Geist and
Geist Mono, variable weight 100-900, listed in src/fonts/manifest.txt and licensed under
the SIL Open Font License (src/fonts/OFL.txt). They are embedded as base64 so the iPhone
and iPad render the same type: iOS can't use fonts installed on a Mac.
"""
import base64
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
NAME = "Nord Lane"
MANIFEST = {
    "name": NAME,
    "version": "1.0.0",
    "minAppVersion": "1.5.0",
    "author": "Alex Silachev",
    "authorUrl": "https://github.com/asilachev",
}

faces = []
for line in (SRC / "fonts" / "manifest.txt").read_text().splitlines():
    family, subset, filename, unicode_range, _size = line.split("\t")
    data = base64.b64encode((SRC / "fonts" / filename).read_bytes()).decode()
    faces.append(
        f"/* {family}, {subset} */\n"
        f"@font-face {{\n"
        f"  font-family: '{family}';\n"
        f"  font-style: normal;\n"
        f"  font-weight: 100 900;\n"
        f"  font-display: swap;\n"
        f"  src: url(data:font/woff2;base64,{data}) format('woff2');\n"
        f"  unicode-range: {unicode_range};\n"
        f"}}\n"
    )

args = [a for a in sys.argv[1:] if not a.startswith("--")]
no_fonts = "--no-fonts" in sys.argv[1:]
if no_fonts and not args:
    sys.exit("--no-fonts installs into vaults only (the repo's theme.css stays the full build): pass a vault path")

base = (SRC / "theme.src.css").read_text()
full = base + "\n/* ---------- Fonts: Geist and Geist Mono (SIL Open Font License, src/fonts/OFL.txt) ---------- */\n\n" + "\n".join(faces)
lite = base + "\n/* Built with --no-fonts: Geist and Geist Mono are used when installed; otherwise the fallbacks. */\n"
manifest = json.dumps(MANIFEST, indent=2) + "\n"

targets = [(ROOT, full)]
for arg in args:
    vault = pathlib.Path(arg).expanduser().resolve()
    if not (vault / ".obsidian").is_dir():
        sys.exit(f"not an Obsidian vault (no .obsidian folder): {vault}")
    targets.append((vault / ".obsidian" / "themes" / NAME, lite if no_fonts else full))

for out, css in targets:
    out.mkdir(parents=True, exist_ok=True)
    (out / "theme.css").write_text(css)
    (out / "manifest.json").write_text(manifest)
    print(f"wrote {out / 'theme.css'} ({(out / 'theme.css').stat().st_size // 1024} KB)")
