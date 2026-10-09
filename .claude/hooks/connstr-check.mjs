// PostToolUse hook, wired in .claude/settings.json.
// Enforce one MSSQL connectionString format in web.config / app.config and their
// web.*.config / app.*.config transforms.
//
// Template:
//   Data Source={host};Initial Catalog={database};User ID={userid};Password={password};
//   Integrated Security=False;Application Name={project};Connect Timeout=30;MultipleActiveResultSets=True;
// {project} = name of the nearest .csproj/.vbproj above the config file.
//
//   node connstr-check.mjs                      hook mode: reads PostToolUse JSON on stdin, exit 2 on violation
//   node connstr-check.mjs --fix ROOT           dry run: list what would change under ROOT
//   node connstr-check.mjs --fix ROOT --write   apply
//   node connstr-check.mjs --selftest
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const NAME_RE = /^(web|app)(\..+)?\.config$/i;
const ADD_RE = /<add\b[^>]*>/gi;
const CS_RE = /(\bconnectionString\s*=\s*")([^"]*)(")/i;
const PROV_RE = /\bproviderName\s*=\s*"([^"]*)"/i;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const SYNONYMS = {
  "data source": "Data Source", "server": "Data Source", "address": "Data Source",
  "addr": "Data Source", "network address": "Data Source",
  "initial catalog": "Initial Catalog", "database": "Initial Catalog",
  "user id": "User ID", "uid": "User ID", "user": "User ID",
  "password": "Password", "pwd": "Password",
};
const REPLACED = new Set(["integrated security", "trusted_connection", "application name", "app",
  "connect timeout", "connection timeout", "timeout", "multipleactiveresultsets"]);
const KEEP = ["Data Source", "Initial Catalog", "User ID", "Password"];
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

const unescapeXml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1))
    : ENTITIES[e.toLowerCase()] ?? m);
const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const build = (p, app) =>
  `Data Source=${p["Data Source"]};Initial Catalog=${p["Initial Catalog"]};` +
  `User ID=${p["User ID"]};Password=${p["Password"]};Integrated Security=False;` +
  `Application Name=${app};Connect Timeout=30;MultipleActiveResultSets=True;`;

function parse(cs) {
  // ponytail: plain split on ';' — values containing ';' or quotes are not supported
  const parts = {}, dropped = [];
  for (const kv of cs.split(";").map((s) => s.trim()).filter(Boolean)) {
    const i = kv.indexOf("=");
    const k = (i < 0 ? kv : kv.slice(0, i)).trim().toLowerCase();
    const v = i < 0 ? "" : kv.slice(i + 1).trim();
    if (SYNONYMS[k]) parts[SYNONYMS[k]] = v;
    else if (!REPLACED.has(k)) dropped.push(kv);
  }
  return { parts, dropped };
}

function isMssql(tag, cs) {
  const p = PROV_RE.exec(tag);
  if (p) return p[1].toLowerCase().includes("sqlclient");
  const low = cs.toLowerCase();
  return !low.includes("metadata=") && (low.includes("data source=") || low.includes("server="));
}

function projectName(cfg) {
  let d = path.dirname(path.resolve(cfg));
  for (;;) {
    const names = fs.readdirSync(d).sort();
    const hit = names.find((n) => /\.csproj$/i.test(n)) ?? names.find((n) => /\.vbproj$/i.test(n));
    if (hit) return path.parse(hit).name;
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

// Returns [{start, end, old, new, note}] per MSSQL connectionString; start/end bound the attribute value.
function scan(text, app) {
  // blank out <!-- --> with same-length spaces: VS transform templates carry a sample
  // connectionString in a comment, and fix() needs offsets that still match the real text
  const masked = text.replace(COMMENT_RE, (c) => " ".repeat(c.length));
  const out = [];
  for (const tag of masked.matchAll(ADD_RE)) {
    const m = CS_RE.exec(tag[0]);
    if (!m) continue;
    const old = unescapeXml(m[2]);
    if (!isMssql(tag[0], old)) continue;
    const start = tag.index + m.index + m[1].length, end = start + m[2].length;
    const { parts, dropped } = parse(old);
    const missing = KEEP.filter((k) => !parts[k]);
    if (missing.length) {
      out.push({ start, end, old, new: null, note: `缺少 ${missing.join(", ")}（Integrated Security=True 的連線需人手處理）` });
      continue;
    }
    out.push({ start, end, old, new: build(parts, app), note: dropped.length ? `將捨棄: ${dropped.join("; ")}` : null });
  }
  return out;
}

const BOMS = [["utf8", [0xef, 0xbb, 0xbf]], ["utf16le", [0xff, 0xfe]], ["utf16be", [0xfe, 0xff]]];

function read(file) {
  const raw = fs.readFileSync(file);
  for (const [enc, bom] of BOMS) {
    if (bom.every((b, i) => raw[i] === b)) {
      const body = raw.subarray(bom.length);
      const text = enc === "utf16be" ? Buffer.from(body).swap16().toString("utf16le") : body.toString(enc);
      return { text, enc, bom: true };
    }
  }
  // fatal: a non-UTF-8 (ANSI) file throws instead of being silently mangled on write
  return { text: new TextDecoder("utf-8", { fatal: true }).decode(raw), enc: "utf8", bom: false };
}

function write(file, text, { enc, bom }) {
  let body = Buffer.from(text, enc === "utf16be" ? "utf16le" : enc);
  if (enc === "utf16be") body = body.swap16();
  const head = bom ? Buffer.from(BOMS.find(([e]) => e === enc)[1]) : Buffer.alloc(0);
  fs.writeFileSync(file, Buffer.concat([head, body]));
}

function checkFile(file) {
  const { text } = read(file);
  const app = projectName(file) ?? "{appName}";
  const errs = [];
  for (const r of scan(text, app)) {
    if (r.new === null) errs.push(`${r.old}\n  → ${r.note}`);
    else if (r.old !== r.new) errs.push(`${r.old}\n  → 應為 ${r.new}` + (r.note ? `\n  → ${r.note}` : ""));
  }
  if (app === "{appName}" && errs.length) errs.push("找不到 .csproj，Application Name 請填項目名稱");
  return errs;
}

function fix(root, apply) {
  for (const rel of fs.readdirSync(root, { recursive: true })) {
    const file = path.join(root, rel);
    if (!NAME_RE.test(path.basename(file)) || !fs.statSync(file).isFile()) continue;
    let doc;
    try { doc = read(file); } catch { console.log(`SKIP ${file}: 不是 UTF-8 / UTF-16，需人手處理`); continue; }
    const app = projectName(file);
    if (!app) { console.log(`SKIP ${file}: 找不到 .csproj`); continue; }
    let out = "", pos = 0, changed = false;
    for (const r of scan(doc.text, app)) {
      if (r.new === null) { console.log(`MANUAL ${file}: ${r.note}`); continue; }
      if (r.note) console.log(`WARN ${file}: ${r.note}`);
      if (r.old !== r.new) {
        console.log(`DIFF ${file}\n  - ${r.old}\n  + ${r.new}`);
        out += doc.text.slice(pos, r.start) + escapeXml(r.new);
        pos = r.end;
        changed = true;
      }
    }
    if (changed) {
      console.log(`${apply ? "FIXED" : "WOULD FIX"} ${file}`);
      if (apply) write(file, out + doc.text.slice(pos), doc);
    }
  }
}

function hook() {
  const data = JSON.parse(fs.readFileSync(0, "utf8"));
  const file = data.tool_input?.file_path ?? "";
  if (!NAME_RE.test(path.basename(file)) || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) return 0;
  const errs = checkFile(file);
  if (!errs.length) return 0;
  process.stderr.write(`${file} connectionString 不符合統一寫法:\n${errs.join("\n")}\n`);
  return 2;
}

function selftest() {
  const good = build({ "Data Source": "h", "Initial Catalog": "d", "User ID": "u", "Password": "p" }, "Proj");
  const xml = `<connectionStrings><add name="a" connectionString="${good}" providerName="System.Data.SqlClient"/>` +
    '<add name="b" connectionString="Server=h;Database=d;uid=u;pwd=p&amp;q;Encrypt=True"/>' +
    '<add name="c" connectionString="Server=h;Database=d;Integrated Security=True"/>' +
    '<add name="d" connectionString="Data Source=x.db" providerName="System.Data.SQLite"/>' +
    '<add name="e" connectionString="metadata=res://*;provider connection string=&quot;x&quot;"/>' +
    '<!-- <add name="f" connectionString="Data Source=x;Integrated Security=True"/> --></connectionStrings>';
  const r = scan(xml, "Proj");
  assert.equal(r.length, 3);
  assert.equal(r[0].old, r[0].new);
  assert.equal(xml.slice(r[0].start, r[0].end), good);
  assert.equal(r[1].new, build({ "Data Source": "h", "Initial Catalog": "d", "User ID": "u", "Password": "p&q" }, "Proj"));
  assert.ok(r[1].note.includes("Encrypt=True"));
  assert.equal(r[2].new, null);
  for (const n of ["Web.Release.config", "app.Debug.config", "web.config", "App.config"]) assert.ok(NAME_RE.test(n), n);
  assert.ok(!NAME_RE.test("packages.config"));
  assert.equal(escapeXml(unescapeXml("a&amp;b&lt;&#x41;&#66;")), "a&amp;b&lt;AB");
  console.log("selftest ok");
}

const a = process.argv.slice(2);
if (a[0] === "--selftest") selftest();
else if (a[0] === "--fix") fix(a[1], a.includes("--write"));
else process.exitCode = hook();
