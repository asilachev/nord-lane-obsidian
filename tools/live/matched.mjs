// node cdp.mjs run matched.mjs <css selector> <property-substring>
// Prints every matched CSS rule on the first element matching the selector that sets the property.
export default async function (c, [selector, prop = "margin"]) {
  await c.send("DOM.enable");
  await c.send("CSS.enable");
  const { root } = await c.send("DOM.getDocument", { depth: 1 });
  const { nodeId } = await c.send("DOM.querySelector", { nodeId: root.nodeId, selector });
  if (!nodeId) { console.log("no node for", selector); return; }
  const m = await c.send("CSS.getMatchedStylesForNode", { nodeId });
  for (const r of m.matchedCSSRules || []) {
    const props = r.rule.style.cssProperties.filter(p => p.name.includes(prop) && p.value);
    if (!props.length) continue;
    console.log(`${r.rule.origin} | ${r.rule.selectorList.text.slice(0, 160)}\n    ` + props.map(p => `${p.name}: ${p.value}${p.important ? " !important" : ""}`).join("; "));
  }
  const cs = await c.send("CSS.getComputedStyleForNode", { nodeId });
  console.log("computed:", cs.computedStyle.filter(p => p.name.startsWith(prop)).map(p => `${p.name}=${p.value}`).join(" "));
}
