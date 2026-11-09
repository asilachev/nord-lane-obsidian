// Minimal Chrome DevTools Protocol client for the isolated Obsidian test instance.
//   node cdp.mjs eval '<js expression>'
//   node cdp.mjs run scenario.mjs [args...]     (scenario default-exports async (c, args) => {})
import fs from "node:fs";
import path from "node:path";

const PORT = process.env.CDP_PORT || 9333;

export async function connect() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const t = list.find(t => t.type === "page" && t.url.includes("obsidian.md/index.html"));
  if (!t) throw new Error("no Obsidian page target");
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    } else if (m.method === "Runtime.consoleAPICalled" && ["error", "warning", "assert"].includes(m.params.type)) {
      logs.push(`[console.${m.params.type}] ` + m.params.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 600));
    } else if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails;
      logs.push("[exception] " + String(d.exception?.description || d.text).slice(0, 600));
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send("Runtime.enable");
  const evaluate = async expr => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const shot = async (file, opts = {}) => {
    const r = await send("Page.captureScreenshot", { format: "png", ...opts });
    fs.writeFileSync(file, Buffer.from(r.data, "base64"));
    return file;
  };
  const viewport = (width, height, mobile = false, scale = 1) =>
    send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  return { send, evaluate, shot, viewport, sleep, logs, close: () => ws.close() };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const c = await connect();
  const [mode, arg, ...rest] = process.argv.slice(2);
  try {
    if (mode === "eval") console.log(JSON.stringify(await c.evaluate(arg), null, 2));
    else if (mode === "run") await (await import(path.resolve(arg))).default(c, rest);
  } finally {
    await c.sleep(200);
    if (c.logs.length) console.log("--- console\n" + [...new Set(c.logs)].join("\n"));
    c.close();
  }
}
