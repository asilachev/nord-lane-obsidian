#!/usr/bin/env python3
"""Contrast audit: every text and background pair the theme uses, in light and dark,
against WCAG AA (4.5:1 for text, 3:1 for faint secondary labels). Callout titles are
measured on their own tint. Exits 1 on any failure.

    python3 tools/contrast.py [src/theme.src.css]
"""
import pathlib, re, sys
css = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent / "src/theme.src.css").read_text()

def block(selector):
    i = css.index(selector + " {"); j = css.index("\n}", i)
    return css[i:j]

def props(text):
    out = {}
    for m in re.finditer(r"(--[\w-]+)\s*:\s*([^;]+);", text):
        out[m.group(1)] = m.group(2).strip()
    return out

shared = props(block(".theme-light, .theme-dark"))
modes = {"light": {**props(block(".theme-light")), **{}}, "dark": props(block(".theme-dark"))}

def resolve(v, env, depth=0):
    m = re.fullmatch(r"var\((--[\w-]+)(?:,\s*([^)]+))?\)", v.strip())
    if m and depth < 10:
        name = m.group(1)
        if name in env: return resolve(env[name], env, depth + 1)
        if m.group(2): return resolve(m.group(2), env, depth + 1)
    return v.strip()

def rgb(v):
    v = v.strip()
    if v.startswith("#"):
        h = v[1:]
        if len(h) == 3: h = "".join(c * 2 for c in h)
        return tuple(int(h[k:k + 2], 16) for k in (0, 2, 4))
    m = re.fullmatch(r"(\d+),\s*(\d+),\s*(\d+)", v)
    if m: return tuple(int(x) for x in m.groups())
    raise ValueError(v)

def lum(c):
    def ch(x):
        x /= 255
        return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    r, g, b = map(ch, c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

def mix(fg, bg, alpha):
    return tuple(round(alpha * f + (1 - alpha) * b) for f, b in zip(fg, bg))

# (label, text token, background token or ("tint", callout var), need)
pairs = [
    ("body text on page", "--text-normal", "--nl-bg", 4.5),
    ("headings on page", "--nl-ink", "--nl-bg", 4.5),
    ("muted text on page", "--text-muted", "--nl-bg", 4.5),
    ("faint text on page", "--text-faint", "--nl-bg", 3.0),
    ("links on page", "--link-color", "--nl-bg", 4.5),
    ("accent ink on page", "--nl-accent-ink", "--nl-bg", 4.5),
    ("muted text on band", "--text-muted", "--nl-band", 4.5),
    ("faint text on band", "--text-faint", "--nl-band", 3.0),
    ("body text on band (code)", "--text-normal", "--nl-band", 4.5),
    ("red text on page", "--nl-red", "--nl-bg", 4.5),
    ("green text on page", "--nl-green", "--nl-bg", 4.5),
    ("amber text on page", "--nl-amber", "--nl-bg", 4.5),
    ("red pill", "--nl-red", "--nl-red-soft", 4.5),
    ("green pill", "--nl-green", "--nl-green-soft", 4.5),
    ("amber pill", "--nl-amber", "--nl-amber-soft", 4.5),
    ("on-accent text on accent fill", "--nl-on-accent", "--nl-accent-fill", 4.5),
    ("text on heat-1", "--nl-on-heat-1", "--nl-heat-1", 4.5),
    ("text on heat-2", "--nl-on-heat-2", "--nl-heat-2", 4.5),
    ("text on heat-3", "--nl-on-heat-3", "--nl-heat-3", 4.5),
]
callouts = ["--callout-note", "--callout-tip", "--callout-question", "--callout-warning", "--callout-error", "--callout-quote"]

fails = 0
for mode, env0 in modes.items():
    env = {**shared, **env0}
    bg = rgb(resolve("var(--nl-bg)", env))
    print(f"== {mode}")
    rows = []
    for label, fg, bgv, need in pairs:
        try:
            r = ratio(rgb(resolve(f"var({fg})", env)), rgb(resolve(f"var({bgv})", env)))
        except Exception as e:
            rows.append((label, None, need)); continue
        rows.append((label, r, need))
    for cv in callouts:
        c = rgb(resolve(f"var({cv})", env))
        tint = mix(c, bg, 0.11)
        rows.append((f"callout title {cv[10:]} on its tint", ratio(c, tint), 4.5))
        rows.append((f"body text in {cv[10:]} callout", ratio(rgb(resolve("var(--text-normal)", env)), tint), 4.5))
    for label, r, need in rows:
        mark = "ok " if r and r >= need else ("FAIL" if r else "?? ")
        if mark == "FAIL": fails += 1
        print(f"  {mark} {r and round(r, 2) or '-':>5}  (need {need})  {label}")
print("fails:", fails)
sys.exit(1 if fails else 0)
