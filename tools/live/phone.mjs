// node cdp.mjs run phone.mjs <width> <height> <suffix> <note=name>...
// The phone (or tablet) layout. Turns on Obsidian's mobile emulation if it's off (that
// reloads the app), sets a touch viewport and reloads, so Obsidian lays out as a phone.
// Then for each note: opens it in Live Preview, reports Dataview errors and anything wider
// than the screen, and saves its first two screens as shots/<name>-<suffix>-<n>.png
// (full-height captures come out blank in mobile mode). Back to desktop:
//   node cdp.mjs eval 'app.emulateMobile(false)'
import { openNote, waitFor, READY } from "./lib.mjs";

const SCREENS = 2;

export default async function (c, [w = "390", h = "844", suffix = "phone", ...pairs]) {
  const W = +w, H = +h;
  if (!(await c.evaluate(`document.body.classList.contains("is-mobile")`))) {
    await c.evaluate(`(app.emulateMobile(true), 1)`).catch(() => {});
    await c.sleep(1500);
    await waitFor(c, READY);
  }
  await c.viewport(W, H, true, 1);
  await c.send("Page.reload");
  await c.sleep(1500);
  await waitFor(c, READY);
  await c.sleep(1500);
  console.log(JSON.stringify(await c.evaluate(`({ mobile: document.body.classList.contains("is-mobile"), phone: document.body.classList.contains("is-phone"), tablet: document.body.classList.contains("is-tablet"), w: innerWidth })`)));
  for (const pair of pairs) {
    const [note, name = note.replace(/\.md$/, "")] = pair.split("=");
    await openNote(c, note, "source");
    await c.sleep(3000);
    const info = await c.evaluate(`(() => {
      const el = window.__nlLeaf.view.containerEl, s = el.querySelector(".cm-scroller");
      const errs = [...el.querySelectorAll(".dataview-error, pre.dataview")].map(e => e.innerText.slice(0, 300));
      const over = [...el.querySelectorAll(".cm-content *")].filter(x => x.getBoundingClientRect().right > innerWidth + 1).slice(0, 5)
        .map(x => x.tagName + "." + String(x.className).slice(0, 40) + " r=" + Math.round(x.getBoundingClientRect().right));
      return { scrollH: s.scrollHeight, scrollW: s.scrollWidth, clientW: s.clientWidth, errs, over };
    })()`);
    console.log(name, JSON.stringify(info));
    for (let i = 0; i < SCREENS; i++) {
      await c.evaluate(`(window.__nlLeaf.view.containerEl.querySelector(".cm-scroller").scrollTop = ${i * (H - 120)}, 1)`);
      await c.sleep(900);
      await c.shot(`shots/${name}-${suffix}-${i + 1}.png`);
    }
  }
}
