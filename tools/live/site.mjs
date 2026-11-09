// node cdp.mjs run site.mjs <lang> <out-dir> <field.md> <books.md> <reading.md> <table heading> [only]
// The landing page's screenshots in one language (#17), in the running test Obsidian. Sets
// Obsidian's own language, then saves to <out-dir>: hero-light and hero-dark (the field note at
// 1600×1000 with the file tree), tables (the same note scrolled to its table), cards (the books
// note), dashboard (the reading note, dark) and three phone screens. scripts/site-shots.mjs
// builds the vault and calls this; run that, not this.
//
// No screenshot shows a cut-off block: before each shot, every block that would cross the top or
// bottom of the visible area (or sit under the status bar or the phone's toolbar) is hidden, so a
// screen ends on whole paragraphs, tables and cards.
import { openNote, waitFor, READY } from "./lib.mjs";

const THEME = { light: "moonstone", dark: "obsidian" };

export default async function (c, [lang, out, field, books, reading, heading, only = ""]) {
  // Optional: a comma-separated list of the shots to take, such as phone-books,cards.
  const wanted = (name) => !only || only.split(",").includes(name);
  const settle = async () => { await c.sleep(1500); await waitFor(c, READY); await c.sleep(1500); };

  // Obsidian's own language: it reads localStorage.language when the app loads.
  const want = lang === "en" ? null : lang;
  if ((await c.evaluate(`localStorage.getItem("language")`)) !== want) {
    await c.evaluate(want ? `localStorage.setItem("language", ${JSON.stringify(want)})` : `localStorage.removeItem("language")`);
    await c.send("Page.reload");
    await settle();
  }
  console.log(JSON.stringify(await c.evaluate(`({ language: localStorage.getItem("language"), moment: window.moment && moment.locale() })`)));

  const theme = async (mode) => { await c.evaluate(`(app.changeTheme(${JSON.stringify(THEME[mode])}), 1)`); await c.sleep(700); };
  const scroller = `(() => { const v = window.__nlLeaf.view; return v.containerEl.querySelector(v.getMode() === "preview" ? ".markdown-preview-view" : ".cm-scroller"); })()`;

  // Scroll the open note until the anchor (an h2 with this text, or a CSS selector) sits `margin`
  // pixels below the top of the window. Reading view renders long notes lazily, so step down
  // until the anchor exists.
  const scrollTo = (anchor, margin) => c.evaluate(`(async () => {
    const el = ${scroller};
    const find = () => ${JSON.stringify(anchor)}.startsWith(".") ? el.querySelector(${JSON.stringify(anchor)})
      : [...el.querySelectorAll("h2")].find(e => e.textContent.trim() === ${JSON.stringify(anchor)});
    for (let i = 0; i < 20; i++) {
      const a = find();
      if (a) { el.scrollTop += a.getBoundingClientRect().top - ${margin}; return Math.round(el.scrollTop); }
      el.scrollTop += 400; await new Promise(r => requestAnimationFrame(r));
    }
    return "anchor not found: " + ${JSON.stringify(anchor)};
  })()`);

  // Hide every block that crosses the visible area [top, bottom] (window coordinates). Blocks are
  // the note's sections and the nl-block parts of a dashboard.
  const trim = (top, bottom) => c.evaluate(`(() => {
    const el = ${scroller};
    const blocks = [...el.querySelectorAll(".markdown-preview-section > div")]
      .flatMap(d => d.querySelector(".nl-block") ? [...d.querySelectorAll(".nl-block")] : [d]);
    let hidden = 0;
    for (const b of blocks) {
      const r = b.getBoundingClientRect();
      if (!r.height || r.bottom <= ${top} || r.top >= ${bottom}) { if (r.top >= ${bottom} || r.bottom <= ${top}) { b.style.visibility = "hidden"; } continue; }
      if (r.top < ${top} || r.bottom > ${bottom}) { b.style.visibility = "hidden"; hidden++; }
    }
    return hidden;
  })()`);

  const expandFolders = () => c.evaluate(`(() => {
    const fe = app.workspace.getLeavesOfType("file-explorer")[0];
    for (const item of Object.values((fe && fe.view.fileItems) || {})) if (item.setCollapsed && item.file && item.file.children) item.setCollapsed(false);
    return 1;
  })()`).catch(() => 0);

  const desk = async (note, w, h, name, { tree = false, at } = {}) => {
    if (!wanted(name)) return;
    await c.viewport(w, h, false, 1);
    await c.evaluate(`(${tree} ? app.workspace.leftSplit.expand() : app.workspace.leftSplit.collapse(), app.workspace.rightSplit.collapse(), 1)`);
    await openNote(c, note, "preview");
    if (tree) await expandFolders();
    await c.sleep(2500);
    // The top is where the note's own area starts; the bottom stops short of the status bar.
    const top = await c.evaluate(`Math.round(${scroller}.getBoundingClientRect().top)`);
    if (at) console.log(name, "scroll", await scrollTo(at, top + 28));
    await c.sleep(600);
    console.log(name, "trimmed", await trim(top + 2, h - 36));
    await c.sleep(400);
    console.log(await c.shot(`${out}/${name}.png`));
  };

  await theme("light");
  await desk(field, 1600, 1000, "hero-light", { tree: true });
  await theme("dark");
  await desk(field, 1600, 1000, "hero-dark", { tree: true });
  await desk(reading, 1440, 1060, "dashboard");
  await theme("light");
  await desk(field, 1100, 600, "tables", { at: heading });
  await desk(books, 900, 560, "cards");

  // The phone layout: Obsidian's mobile emulation on a 390×844 touch screen, as phone.mjs does.
  if (!["phone-field", "phone-books", "phone-reading"].some(wanted)) return;
  if (!(await c.evaluate(`document.body.classList.contains("is-mobile")`))) {
    await c.evaluate(`(app.emulateMobile(true), 1)`).catch(() => {});
    await settle();
  }
  await c.viewport(390, 844, true, 1);
  await c.send("Page.reload");
  await settle();
  // The landing page draws its own status bar over the top 56 px, and Obsidian's toolbar floats
  // over the bottom 100.
  const phone = async (mode, note, name, { at } = {}) => {
    if (!wanted(name)) return;
    await theme(mode);
    await openNote(c, note, "preview");
    await c.sleep(2500);
    if (at) console.log(name, "scroll", await scrollTo(at, 72));
    await c.sleep(800);
    console.log(name, "trimmed", await trim(58, 844 - 100));
    await c.sleep(400);
    console.log(await c.shot(`${out}/${name}.png`));
  };
  // The table that scrolls sideways, then the Russian and Serbian lines below it.
  await phone("light", field, "phone-field", { at: heading });
  // Four cards three across fill the screen once the grid is at the top.
  await phone("dark", books, "phone-books", { at: ".gc-grid" });
  // The stats two across and the heatmap's last weeks.
  await phone("light", reading, "phone-reading", { at: ".nl-stats" });

  await c.evaluate(`(app.emulateMobile(false), 1)`).catch(() => {});
  await settle();
  await theme("light");
}
