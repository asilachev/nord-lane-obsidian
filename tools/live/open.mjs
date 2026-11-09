// node cdp.mjs run open.mjs <note> <mode: source|preview> <width> <height> <shot-name|-> [left|none] [mobile]
// Opens a note in the test instance, waits for Dataview, reports errors, screenshots the
// whole note by growing the viewport to the scroll height (capped).
export default async function (c, [note, mode = "source", w = "1440", h = "900", name = "-", sidebar = "left", mobile = ""]) {
  const W = +w, H = +h, isMobile = mobile === "mobile";
  await c.viewport(W, H, isMobile, 1);
  await c.evaluate(`(async () => {
    if (!${isMobile}) {
      ${JSON.stringify(sidebar)} === "left" ? app.workspace.leftSplit.expand() : app.workspace.leftSplit.collapse();
      app.workspace.rightSplit.collapse();
    }
    const f = app.vault.getAbstractFileByPath(${JSON.stringify(note)});
    if (!f) throw new Error("missing note");
    const leaf = app.workspace.getLeaf(false);
    await leaf.setViewState({ type: "empty" });
    await leaf.openFile(f, { active: true, state: { mode: ${JSON.stringify(mode)}, source: false } });
    app.workspace.setActiveLeaf(leaf, { focus: false });
  })()`);
  await c.sleep(3500);
  const probe = `(() => {
    const v = app.workspace.getMostRecentLeaf().view;
    const el = v.containerEl;
    const mode = v.getMode ? v.getMode() : null;
    const scroller = el.querySelector(mode === "preview" ? ".markdown-preview-view" : ".cm-scroller");
    const errs = [...el.querySelectorAll(".dataview-error, .dataview.dataview-error, pre.dataview")].map(e => e.innerText.slice(0, 500));
    const nl = el.querySelector("[class^='nl-'], [class*=' nl-']");
    const body = scroller ? scroller.getBoundingClientRect() : null;
    const roots = [...el.querySelectorAll(".block-language-dataviewjs")].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; });
    return { mode, file: v.file && v.file.path, errs, nlMounted: !!nl, scrollH: scroller && scroller.scrollHeight, pane: body && [Math.round(body.left), Math.round(body.width)], dvBlocks: roots };
  })()`;
  let info = await c.evaluate(probe);
  console.log(JSON.stringify(info));
  if (name === "-") return;
  const full = Math.min(Math.max(H, (info.scrollH || H) + 120), 7000);
  if (full > H) { await c.viewport(W, full, isMobile, 1); await c.sleep(1500); }
  console.log(await c.shot(`shots/${name}.png`));
  await c.viewport(W, H, isMobile, 1);
}
