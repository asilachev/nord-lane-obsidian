// node cdp.mjs run shot.mjs <width> <height> <name> [scrollTop] [mobile]
// One screenshot of whatever the window shows now, after scrolling the active note.
export default async function (c, [w = "390", h = "844", name = "shot", top = "0", mobile = ""]) {
  await c.viewport(+w, +h, mobile === "mobile", 1);
  await c.evaluate(`(() => { const v = (window.__nlLeaf || app.workspace.getMostRecentLeaf()).view; const s = v.containerEl.querySelector(v.getMode() === "preview" ? ".markdown-preview-view" : ".cm-scroller"); if (s) s.scrollTop = ${+top}; return 1; })()`);
  await c.sleep(1500);
  console.log(await c.shot(`shots/${name}.png`));
}
