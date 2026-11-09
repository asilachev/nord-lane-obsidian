// node cdp.mjs run view.mjs <note> <mode: source|preview> <width> <height> <shot-name> [scrollTop=0|full] [left|none]
// One screen of a note as you would see it: forces the mode (a remembered reading view
// otherwise wins), scrolls to scrollTop, and screenshots the window at its real size.
export default async function (c, [note, mode = "source", w = "1440", h = "900", name = "view", top = "0", sidebar = "left"]) {
  const W = +w, H = +h;
  await c.viewport(W, H, false, 1);
  await c.evaluate(`(async () => {
    ${JSON.stringify(sidebar)} === "left" ? app.workspace.leftSplit.expand() : app.workspace.leftSplit.collapse();
    app.workspace.rightSplit.collapse();
    const f = app.vault.getAbstractFileByPath(${JSON.stringify(note)});
    if (!f) throw new Error("missing note");
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(f, { active: true, state: { mode: ${JSON.stringify(mode)}, source: false } });
    if (leaf.view.getMode() !== ${JSON.stringify(mode)}) {
      const vs = leaf.getViewState();
      vs.state.mode = ${JSON.stringify(mode)}; vs.state.source = false;
      await leaf.setViewState(vs);
    }
    app.workspace.setActiveLeaf(leaf, { focus: false });
  })()`);
  await c.sleep(3500);
  const info = await c.evaluate(`(() => {
    const v = app.workspace.getMostRecentLeaf().view;
    const el = v.containerEl;
    const s = el.querySelector(v.getMode() === "preview" ? ".markdown-preview-view" : ".cm-scroller");
    s.scrollTop = ${+top};
    const errs = [...el.querySelectorAll(".dataview-error, pre.dataview")].map(e => e.innerText.slice(0, 300));
    return { mode: v.getMode(), scrollH: s.scrollHeight, errs };
  })()`);
  await c.sleep(1500);
  console.log(JSON.stringify(info));
  // scrollTop "full": grow the window to the whole note (capped) for one tall shot.
  if (top === "full") { await c.viewport(W, Math.min(Math.max(H, info.scrollH + 120), 9000), false, 1); await c.sleep(2500); }
  console.log(await c.shot(`shots/${name}.png`));
  if (top === "full") await c.viewport(W, H, false, 1);
}
