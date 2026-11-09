// node cdp.mjs run phone.mjs <width> <height> <suffix> <note=name>...
// Emulates a phone (or tablet) viewport, reloads Obsidian so it lays out as one, then
// opens each note in Live Preview and screenshots it at full height.
export default async function (c, [w, h, suffix, ...pairs]) {
  const W = +w, H = +h;
  await c.viewport(W, H, true, 1);
  await c.evaluate("setTimeout(() => location.reload(), 50), 1");
  await c.sleep(9000);
  console.log(JSON.stringify(await c.evaluate(`({ mobile: document.body.classList.contains("is-mobile"), phone: document.body.classList.contains("is-phone"), tablet: document.body.classList.contains("is-tablet"), w: innerWidth })`)));
  for (const pair of pairs) {
    const [note, name] = pair.split("=");
    await c.viewport(W, H, true, 1);
    await c.evaluate(`(async () => {
      const f = app.vault.getAbstractFileByPath(${JSON.stringify(note)});
      const leaf = app.workspace.getLeaf(false);
      await leaf.setViewState({ type: "empty" });
      await leaf.openFile(f, { active: true, state: { mode: "source", source: false } });
      app.workspace.leftSplit.collapse && app.workspace.leftSplit.collapse();
    })()`);
    await c.sleep(3500);
    const info = await c.evaluate(`(() => {
      const v = app.workspace.getMostRecentLeaf().view, el = v.containerEl;
      const s = el.querySelector(".cm-scroller");
      const errs = [...el.querySelectorAll(".dataview-error, pre.dataview")].map(e => e.innerText.slice(0, 300));
      const over = [...el.querySelectorAll(".nl-root *, .block-language-dataviewjs *")].filter(x => x.getBoundingClientRect().right > innerWidth + 1).slice(0, 5).map(x => x.tagName + "." + String(x.className).slice(0, 40) + " r=" + Math.round(x.getBoundingClientRect().right));
      return { scrollH: s && s.scrollHeight, scrollW: s && s.scrollWidth, clientW: s && s.clientWidth, errs, over };
    })()`);
    console.log(name, JSON.stringify(info));
    const full = Math.min(Math.max(H, (info.scrollH || H) + 160), 6000);
    await c.viewport(W, full, true, 1);
    await c.sleep(1500);
    await c.shot(`shots/${name}-${suffix}.png`);
  }
  await c.viewport(W, H, true, 1);
}
