// PostToolUse hook, wired in .claude/settings.json.
// Enforce one NLog.config layout: every project's NLog.config equals nlog-template.config
// (same folder) except the six per-project variable values:
//   logName, appName, smtpServer, mailFrom, mailTo, mailSubject
// Each project keeps its own values in its NLog.config; this hook checks structure only.
//
//   node nlog-check.mjs                      hook mode: reads PostToolUse JSON on stdin, exit 2 on violation
//   node nlog-check.mjs --fix ROOT           dry run: list what would change under ROOT
//   node nlog-check.mjs --fix ROOT --write   apply
//   node nlog-check.mjs --selftest
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const TEMPLATE = fs.readFileSync(new URL("./nlog-template.config", import.meta.url), "utf8");
const NAME_RE = /^nlog\.config$/i;
const SKIP_DIR_RE = /(^|[\\/])(bin|obj|packages|node_modules|\.git)([\\/]|$)/i;
// variable name in NLog.config -> placeholder in the template
const VARS = { logName: "__LOG_NAME__", appName: "__APP_NAME__", smtpServer: "__SMTP_SERVER__",
  mailFrom: "__MAIL_FROM__", mailTo: "__MAIL_TO__", mailSubject: "__MAIL_SUBJECT__" };

const normalize = (s) => s.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").trimEnd() + "\n";
const readVar = (text, name) => new RegExp(`<variable\\s+name="${name}"\\s+value="([^"]*)"`).exec(text)?.[1] ?? null;
// Function replacer: a value containing "$&" must not be read as a replacement pattern.
const expected = (values) => normalize(Object.entries(VARS).reduce((t, [k, ph]) => t.replace(ph, () => values[k]), TEMPLATE));
const readValues = (text) => Object.fromEntries(Object.keys(VARS).map((k) => [k, readVar(text, k)]));

// Returns [] when the file matches, else a list of problems.
function check(text) {
  const values = readValues(text);
  const missing = Object.keys(VARS).filter((k) => !values[k]);
  if (missing.length) return [`variable(s) missing or empty: ${missing.join(", ")}`];
  const want = expected(values).split("\n"), got = normalize(text).split("\n");
  for (let i = 0; i < Math.max(want.length, got.length); i++) {
    if (want[i] !== got[i]) return [`line ${i + 1} differs from nlog-template.config\n  - ${got[i] ?? "(missing)"}\n  + ${want[i] ?? "(missing)"}`];
  }
  return [];
}

function fix(root, apply) {
  for (const rel of fs.readdirSync(root, { recursive: true })) {
    const file = path.join(root, rel);
    if (!NAME_RE.test(path.basename(file)) || SKIP_DIR_RE.test(rel) || !fs.statSync(file).isFile()) continue;
    const text = fs.readFileSync(file, "utf8");
    const values = readValues(text);
    const missing = Object.keys(VARS).filter((k) => !values[k]);
    if (missing.length) { console.log(`MANUAL ${file}: no value to carry over for ${missing.join(", ")}`); continue; }
    if (check(text).length === 0) continue;
    console.log(`${apply ? "FIXED" : "WOULD FIX"} ${file}`);
    if (apply) fs.writeFileSync(file, expected(values));
  }
}

function hook() {
  const data = JSON.parse(fs.readFileSync(0, "utf8"));
  const file = data.tool_input?.file_path ?? "";
  if (!NAME_RE.test(path.basename(file)) || SKIP_DIR_RE.test(file) || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) return 0;
  const errs = check(fs.readFileSync(file, "utf8"));
  if (!errs.length) return 0;
  process.stderr.write(`${file} does not match the house NLog.config (.claude/hooks/nlog-template.config):\n${errs.join("\n")}\n`);
  return 2;
}

function selftest() {
  const vals = { logName: "L", appName: "App", smtpServer: "smtp.example.com", mailFrom: "a@example.com",
    mailTo: "b@example.com", mailSubject: "Subject $& here" };
  const good = expected(vals);
  assert.deepEqual(check(good), []);
  assert.deepEqual(check(good.replace(/\n/g, "\r\n")), []);
  assert.equal(check(good.replace('minlevel="Error"', 'minlevel="Warn"')).length, 1);
  assert.match(check(good.replace('value="App"', 'value=""'))[0], /appName/);
  assert.ok(NAME_RE.test("NLog.config") && !NAME_RE.test("NLog.xsd"));
  assert.ok(SKIP_DIR_RE.test("Proj\\bin\\Debug\\NLog.config") && !SKIP_DIR_RE.test("Proj\\NLog.config"));
  console.log("selftest ok");
}

const a = process.argv.slice(2);
if (a[0] === "--selftest") selftest();
else if (a[0] === "--fix") fix(a[1], a.includes("--write"));
else process.exitCode = hook();
