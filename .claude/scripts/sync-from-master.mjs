#!/usr/bin/env node
// Template sync helper for /wp-update-from-master. Run it from the freshly cloned master, so a
// target that is several versions behind still runs the current logic:
//
//   node "<master>/.claude/scripts/sync-from-master.mjs" report "<target root>"
//   node "<master>/.claude/scripts/sync-from-master.mjs" copy   "<target root>"
//   node "<master>/.claude/scripts/sync-from-master.mjs" scan   "<target root>"
//
// report  Step 2.5 + Step 3 of the skill: versions, then every ✅ manifest path compared by
//         content with line endings and BOM ignored — overwrite (differs), add (master only),
//         project-own (target only), plus 🗑️ paths present in the target and ⚠️ files that differ.
//         Writes nothing.
// copy    Step 4: copies exactly the overwrite + add files of a fresh report. A file that differs
//         only in line endings or BOM is left alone. Never deletes. Run only after the user's go.
// scan    Step 5b: greps the target's living docs for every obsolete name in the 🗑️ tables, and
//         lists live plans whose ## Tasks table has no Manager summary column. Writes nothing.
//
// --master <path> overrides the master root (default: two folders above this script).
// Exit codes: 0 done, 2 usage or a missing manifest.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const mode = args[0];
const mIdx = args.indexOf("--master");
const master = path.resolve(mIdx >= 0 ? args[mIdx + 1] : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".."));
const target = args.find((a, i) => i > 0 && !a.startsWith("--") && args[i - 1] !== "--master");
if (!["report", "copy", "scan"].includes(mode) || !target) {
  console.error("usage: node sync-from-master.mjs report|copy|scan <target root> [--master <path>]");
  process.exit(2);
}
const targetRoot = path.resolve(target);
const manifestPath = path.join(master, "SYNC-MANIFEST.md");
if (!fs.existsSync(manifestPath)) { console.error(`no SYNC-MANIFEST.md in master: ${master}`); process.exit(2); }
if (!fs.existsSync(targetRoot)) { console.error(`target not found: ${targetRoot}`); process.exit(2); }

// ---------- manifest ----------
const manifest = fs.readFileSync(manifestPath, "utf8").replace(/\r\n/g, "\n");

function section(text, headingStart) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("## ") && l.includes(headingStart));
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  return lines.slice(start + 1, end < 0 ? undefined : end);
}
function tableRows(lines) {
  return lines
    .filter((l) => l.startsWith("|") && !/^\|\s*-/.test(l))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((cells) => cells[0] && !/^(Path|Obsolete|Setting)/.test(cells[0]));
}
const firstCode = (cell) => (cell.match(/`([^`]+)`/) || [])[1];

const safe = tableRows(section(manifest, "✅")).map((c) => firstCode(c[0])).filter(Boolean);
const grey = tableRows(section(manifest, "⚠️")).map((c) => firstCode(c[0])).filter(Boolean);
const deletions = tableRows(section(manifest, "🗑️"))
  .map((c) => ({ path: firstCode(c[0]), replacedBy: c[1] }))
  .filter((d) => d.path);
const version = (text) => (text.match(/\|\s*Version\s*\|\s*`?([^`|\s]+)`?\s*\|/) || [])[1];

// ---------- file helpers ----------
const toPosix = (p) => p.split(path.sep).join("/");
function walk(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(toPosix(path.relative(base, full)));
  }
  return out;
}
// Master files of a folder row: when the master is a git checkout, its tracked and untracked
// files minus the git-ignored ones, so a local master's *.local.json never counts as template.
function masterFiles(folder) {
  if (fs.existsSync(path.join(master, ".git"))) {
    const out = execFileSync("git", ["-C", master, "ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", folder], { encoding: "utf8" });
    return out.split("\0").filter(Boolean).filter((f) => fs.existsSync(path.join(master, f)));
  }
  return walk(path.join(master, folder)).map((f) => folder + f);
}
const isText = (buf) => !buf.subarray(0, 8000).includes(0);
function normalized(buf) {
  if (!isText(buf)) return buf;
  let s = buf.toString("utf8");
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return Buffer.from(s.replace(/\r\n/g, "\n"), "utf8");
}
function compare(rel) {
  const m = path.join(master, rel), t = path.join(targetRoot, rel);
  if (!fs.existsSync(t)) return "add";
  const a = fs.readFileSync(m), b = fs.readFileSync(t);
  if (a.equals(b)) return "same";
  return normalized(a).equals(normalized(b)) ? "eol-only" : "overwrite";
}
const isDeleted = (rel) => deletions.some((d) => d.path.endsWith("/") ? (rel + "/").startsWith(d.path) || rel.startsWith(d.path) : rel === d.path);

function plan() {
  const res = { overwrite: [], add: [], eolOnly: [], same: 0, projectOwn: [] };
  for (const entry of safe) {
    const isFolder = entry.endsWith("/");
    const files = isFolder ? masterFiles(entry) : [entry];
    for (const rel of files) {
      if (!fs.existsSync(path.join(master, rel))) continue;
      const r = compare(rel);
      if (r === "same") res.same++;
      else if (r === "eol-only") res.eolOnly.push(rel);
      else res[r].push(rel);
    }
    if (isFolder) {
      const masterSet = new Set(files);
      for (const f of walk(path.join(targetRoot, entry)).map((x) => entry + x)) {
        if (!masterSet.has(f) && !isDeleted(f)) res.projectOwn.push(f);
      }
    }
  }
  return res;
}

// ---------- modes ----------
function report() {
  const tv = fs.existsSync(path.join(targetRoot, "SYNC-MANIFEST.md"))
    ? version(fs.readFileSync(path.join(targetRoot, "SYNC-MANIFEST.md"), "utf8")) : undefined;
  console.log(`Version: target ${tv ? "v" + tv : "none"} → master v${version(manifest)}`);
  const p = plan();
  const list = (title, items, fmt = (x) => x) => {
    console.log(`\n${title} (${items.length})`);
    for (const i of items) console.log("  " + fmt(i));
  };
  list("✅ overwrite — content differs", p.overwrite);
  list("🆕 add — master only", p.add);
  const del = deletions.filter((d) => fs.existsSync(path.join(targetRoot, d.path.replace(/\/$/, ""))));
  list("🗑️ delete after the user's go (Step 4b)", del, (d) => `${d.path} → ${d.replacedBy}`);
  list("🧩 project-own — left untouched", p.projectOwn);
  const greyDiff = grey.filter((g) => fs.existsSync(path.join(master, g)) && fs.existsSync(path.join(targetRoot, g)) && compare(g) === "overwrite");
  const greyMissing = grey.filter((g) => fs.existsSync(path.join(master, g)) && !fs.existsSync(path.join(targetRoot, g)));
  list("⚠️ grey zone — differs, merge by hand (Step 5)", greyDiff);
  if (greyMissing.length) list("ℹ️ grey zone — absent in target; create one only if its manifest row says so", greyMissing);
  console.log(`\nUnchanged: ${p.same} files; line-ending/BOM-only differences ignored: ${p.eolOnly.length}`);
  if (!p.overwrite.length && !p.add.length && !del.length && !greyDiff.length) console.log("Already up to date.");
}

function copy() {
  const p = plan();
  for (const rel of [...p.overwrite, ...p.add]) {
    const dest = path.join(targetRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(master, rel), dest);
    console.log(`${p.add.includes(rel) ? "added" : "overwrote"} ${rel}`);
  }
  console.log(`\nCopied ${p.overwrite.length + p.add.length} files (${p.overwrite.length} overwritten, ${p.add.length} added); ${p.eolOnly.length} line-ending-only differences left as they are. Nothing deleted.`);
}

function terms() {
  const out = new Set();
  for (const { path: p } of deletions) {
    const parts = p.replace(/\/$/, "").split("/");
    const last = parts[parts.length - 1];
    if (p.startsWith(".claude/skills/") && parts.length === 3) out.add(last);
    else if (p.endsWith("/")) out.add(last + "/");
    else out.add(last.replace(/\.md$/, ""));
  }
  return [...out];
}
function livingDocs() {
  const docs = ["CLAUDE.md", "project-memory/overview/system-overview-spec.md"];
  const modules = path.join(targetRoot, "project-memory", "modules");
  if (fs.existsSync(modules)) {
    for (const m of fs.readdirSync(modules, { withFileTypes: true })) {
      if (!m.isDirectory() || m.name === "example-module") continue;
      docs.push(`project-memory/modules/${m.name}/MODULE.md`, `project-memory/modules/${m.name}/${m.name}-flow.md`);
    }
  }
  return docs.filter((d) => fs.existsSync(path.join(targetRoot, d)));
}
function scan() {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pats = terms().map((t) => ({ t, re: new RegExp(`(?<![A-Za-z0-9_-])${esc(t)}(?![A-Za-z0-9_-])`) }));
  let hits = 0;
  console.log("Obsolete names in living docs (fix each only after the user confirms):");
  for (const doc of livingDocs()) {
    const lines = fs.readFileSync(path.join(targetRoot, doc), "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const { t, re } of pats) if (re.test(line)) { hits++; console.log(`  ${doc}:${i + 1}  [${t}]  ${line.trim().slice(0, 160)}`); }
    });
  }
  if (!hits) console.log("  none");

  console.log("\nLive plans whose ## Tasks table has no Manager summary column:");
  let n = 0;
  const modules = path.join(targetRoot, "project-memory", "modules");
  for (const m of fs.existsSync(modules) ? fs.readdirSync(modules, { withFileTypes: true }) : []) {
    const plans = path.join(modules, m.name, "plans");
    if (!m.isDirectory() || !fs.existsSync(plans)) continue;
    for (const f of fs.readdirSync(plans)) {
      if (!f.endsWith(".md") || f.startsWith("_")) continue;
      const text = fs.readFileSync(path.join(plans, f), "utf8");
      if (/^## Tasks/m.test(text) && !text.includes("Manager summary") && !/^> \*\*Status:\*\* Done/m.test(text)) {
        n++; console.log(`  project-memory/modules/${m.name}/plans/${f}`);
      }
    }
  }
  if (!n) console.log("  none");
}

({ report, copy, scan })[mode]();
