// PostToolUse hook, wired in .claude/settings.json.
// A SQL line comment (-- ...) that sits right before the closing quote of a C# string literal in a repository file
// swallows whatever the code appends to that string on the same line (optional filters, ORDER BY, paging).
// Put the comment in C#, or end the SQL line with a line break after the comment.
//
//   node sql-comment-check.mjs                  hook mode: reads PostToolUse JSON on stdin, exit 2 on violation
//   node sql-comment-check.mjs --scan ROOT      list every hit under ROOT (run once before wiring the hook)
//   node sql-comment-check.mjs --selftest
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const FILE_RE = /[\\/]Repositories[\\/][^\\/]+\.cs$/i;
const HIT_RE = /--[^"\r\n]*"\s*[);+]/;
const SKIP_DIRS = new Set(["bin", "obj", ".git", "node_modules", "packages"]);

const hits = (text) => text.split(/\r?\n/).flatMap((line, i) => (HIT_RE.test(line) ? [`${i + 1}: ${line.trim()}`] : []));

function scan(root) {
  let total = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p); }
      else if (FILE_RE.test(p)) for (const h of hits(fs.readFileSync(p, "utf8"))) { console.log(`${p}:${h}`); total++; }
    }
  };
  walk(root);
  console.log(`${total} hit(s)`);
}

function hook() {
  const data = JSON.parse(fs.readFileSync(0, "utf8"));
  const file = data.tool_input?.file_path ?? "";
  if (!FILE_RE.test(file) || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) return 0;
  const found = hits(fs.readFileSync(file, "utf8"));
  if (!found.length) return 0;
  process.stderr.write(`${file}: a SQL line comment ends a string literal, so text appended to that line is commented out:\n` +
    `${found.join("\n")}\nMove the comment into C#, or break the line after it.\n`);
  return 2;
}

function selftest() {
  assert.equal(hits('sql.Append(@"AND b.IsSetID = 0 -- Hide set products");').length, 1);
  assert.equal(hits('sql.Append("... -- note" + filter);').length, 1);
  assert.equal(hits("AND c.ExcludeTopSalesProuct = '0' -- ignore, naming typo").length, 0);
  assert.equal(hits('count--; Foo("x");').length, 0);
  assert.equal(hits("    -- a comment line inside a verbatim string").length, 0);
  assert.ok(FILE_RE.test("C:\\x\\IMS.UnitOfWork\\Repositories\\SalesRepositoryBase.cs"));
  assert.ok(!FILE_RE.test("C:\\x\\IMS.Services\\ReportBaseService.cs"));
  console.log("selftest ok");
}

const a = process.argv.slice(2);
if (a[0] === "--selftest") selftest();
else if (a[0] === "--scan") scan(a[1]);
else process.exitCode = hook();
