// node cdp.mjs run view.mjs <note> <mode: source|preview> <width> <height> <shot-name> [scrollTop|full] [left|none]
// One screen of a note as you'd see it: opens it in the given mode (forced, since a
// remembered reading view would otherwise win), scrolls to scrollTop and saves the window at
// its real size to shots/<shot-name>.png. "full" grows the window to the whole note (capped).
import { openNote } from "./lib.mjs";

export default async function (c, [note, mode = "source", w = "1440", h = "900", name = "view", top = "0", sidebar = "left"]) {
  const W = +w, H = +h;
  await c.viewport(W, H, false, 1);
  await c.evaluate(`(${JSON.stringify(sidebar)} === "left" ? app.workspace.leftSplit.expand() : app.workspace.leftSplit.collapse(), app.workspace.rightSplit.collapse(), 1)`);
  await openNote(c, note, mode);
  await c.sleep(3000);
  const info = await c.evaluate(`(() => {
    const v = window.__nlLeaf.view, el = v.containerEl;
    const s = el.querySelector(v.getMode() === "preview" ? ".markdown-preview-view" : ".cm-scroller");
    if (${JSON.stringify(top)} !== "full") s.scrollTop = ${+top || 0};
    const errs = [...el.querySelectorAll(".dataview-error, pre.dataview")].map(e => e.innerText.slice(0, 300));
    return { file: v.file && v.file.path, mode: v.getMode(), scrollH: s.scrollHeight, errs };
  })()`);
  await c.sleep(1200);
  console.log(JSON.stringify(info));
  if (top === "full") { await c.viewport(W, Math.min(Math.max(H, info.scrollH + 120), 9000), false, 1); await c.sleep(2500); }
  console.log(await c.shot(`shots/${name}.png`));
  if (top === "full") await c.viewport(W, H, false, 1);
}
