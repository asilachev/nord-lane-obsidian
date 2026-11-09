// node cdp.mjs run realwin.mjs <width> <height>
// Drops the viewport emulation and resizes the real window, then reports whether the
// workspace or any scroll container reaches past the window (what emulation can hide).
export default async function (c, [w = "1700", h = "1000"]) {
  await c.send("Emulation.clearDeviceMetricsOverride");
  console.log(await c.evaluate(`(() => {
    let win = null;
    try { win = require("@electron/remote").getCurrentWindow(); } catch (e) {}
    if (!win) try { win = require("electron").remote.getCurrentWindow(); } catch (e) {}
    if (!win) return "no window handle";
    win.setSize(${+w}, ${+h});
    return "resized";
  })()`));
  await c.sleep(2500);
  console.log(JSON.stringify(await c.evaluate(`(() => {
    const W = innerWidth, H = innerHeight;
    const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    const past = [...document.querySelectorAll(".app-container *")].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.height && (b.right > W + 1 || b.bottom > H + 1) && getComputedStyle(e).position !== "fixed"; }).slice(0, 8).map(e => e.tagName.toLowerCase() + "." + String(e.className).slice(0, 50) + " r=" + Math.round(e.getBoundingClientRect().right) + " b=" + Math.round(e.getBoundingClientRect().bottom));
    return { inner: [W, H], outer: [outerWidth, outerHeight], dpr: devicePixelRatio, app: r(".app-container"), workspace: r(".workspace"), files: r(".nav-files-container"), status: r(".status-bar"), past };
  })()`)));
}
