import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const template = await read("src/index.html");
const styles = await read("src/styles.css");
const engine = await read("src/brief.js");
const app = await read("src/app.js");
const pretext = await read("vendor/pretext.js");
const license = await read("vendor/PRETEXT-LICENSE.txt");
const projectLicense = await read("LICENSE");
const exported = pretext.match(/export\s*\{([^}]+)\};?\s*$/);
if (!exported) throw new Error("Pretext's export format changed; review the bundled API.");
const aliases = Object.fromEntries(exported[1].split(",").map((entry) => {
  const match = entry.trim().match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (!match) throw new Error("Unexpected Pretext export: " + entry);
  return [match[2], match[1]];
}));
if (!aliases.prepare || !aliases.layout) throw new Error("Pretext prepare/layout exports are required.");
const bundledPretext = `/*\n${license}\n*/\n${pretext}\nwindow.Pretext = { prepare: ${aliases.prepare}, layout: ${aliases.layout} };`;
const parts = {
  __STYLES__: styles,
  __ENGINE__: engine,
  __PRETEXT__: bundledPretext,
  __APP__: app
};
for (const [marker, value] of Object.entries(parts)) {
  if (template.split(marker).length !== 2) throw new Error(`Expected one ${marker} placeholder.`);
  if (/<\/(?:script|style)/i.test(value)) throw new Error(`Unsafe closing tag in ${marker}.`);
}
let html = template.replace(/__STYLES__|__ENGINE__|__PRETEXT__|__APP__/g, (marker) => parts[marker]);
html = html.replace("<!doctype html>", `<!doctype html>\n<!--\n${projectLicense}\n-->`);
const hashes = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) =>
  "'sha256-" + createHash("sha256").update(match[1]).digest("base64") + "'"
);
const policy = [
  "default-src 'none'",
  `script-src ${hashes.join(" ")}`,
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'"
].join("; ");
html = html.replace("__CSP__", policy);
if (/__(?:CSP|STYLES|ENGINE|PRETEXT|APP)__/.test(html)) throw new Error("Unresolved template marker.");
await mkdir(new URL("docs/", root), { recursive: true });
await mkdir(new URL("dist/", root), { recursive: true });
await writeFile(new URL("docs/index.html", root), html);
await writeFile(new URL("docs/.nojekyll", root), "");
await writeFile(new URL("dist/everyday-ai-brief.html", root), html);
console.log(`Built standalone HTML (${Buffer.byteLength(html)} bytes). No runtime network dependencies.`);
