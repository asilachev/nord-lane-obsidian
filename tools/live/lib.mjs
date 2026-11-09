// Helpers shared by the scenarios. Waits run in Node, never in the page: Obsidian's timers
// are throttled while its window is behind others, which can stall a page-side setTimeout.

// Open a note in the active pane in the given mode (source or preview) and remember its leaf
// as window.__nlLeaf. openLinkText works in mobile emulation too, where getLeaf can throw.
export const openNote = (c, note, mode = "source") => c.evaluate(`(async () => {
  const f = app.vault.getAbstractFileByPath(${JSON.stringify(note)});
  if (!f) throw new Error("missing note: " + ${JSON.stringify(note)});
  await app.workspace.openLinkText(f.path, "", false, { active: true, state: { mode: ${JSON.stringify(mode)}, source: false } });
  const leaf = app.workspace.getMostRecentLeaf();
  if (leaf.view.getMode && leaf.view.getMode() !== ${JSON.stringify(mode)}) {
    const vs = leaf.getViewState();
    vs.state.mode = ${JSON.stringify(mode)};
    vs.state.source = false;
    await leaf.setViewState(vs);
  }
  window.__nlLeaf = leaf;
  return leaf.view.file && leaf.view.file.path;
})()`);

// Poll a page expression from Node until it's truthy.
export async function waitFor(c, expr, timeoutMs = 30000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try { if (await c.evaluate(expr)) return true; } catch (e) { /* the page may be reloading */ }
    await c.sleep(300);
  }
  throw new Error("timed out waiting for " + expr);
}

export const READY = "!!(window.app && app.workspace && app.workspace.layoutReady)";
