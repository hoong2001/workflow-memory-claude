import type { Engine, Register } from 'claude-code'

// Active only when the session's cwd lies inside a TFVC workspace mapping. Mappings come from
// TFVC's own cache (%LOCALAPPDATA%\Microsoft\Team Foundation\<ver>\Cache\Volatile\*\VersionControl.config),
// so detection needs no network and no tf.exe call.

type Workspace = { name: string; paths: string[] }
type Hit = { name: string; root: string }

const norm = (p: string) => p.replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase()
const unxml = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

export const parseWorkspaces = (xml: string): Workspace[] =>
  [...xml.matchAll(/<WorkspaceInfo name="([^"]+)"[\s\S]*?<\/WorkspaceInfo>/g)].map(m => ({
    name: unxml(m[1]),
    paths: [...m[0].matchAll(/<MappedPath path="([^"]+)"/g)].map(p => unxml(p[1])),
  }))

export const findWorkspace = (cwd: string, list: Workspace[]): Hit | undefined => {
  const c = norm(cwd)
  for (const ws of list)
    for (const p of ws.paths) {
      const n = norm(p)
      if (c === n || c.startsWith(n + '\\')) return { name: ws.name, root: p }
    }
  return undefined
}

// `tf status` brief ends with "N change(s), M detected change(s)"; the two are separate lists.
export const countStatus = (out: string) => {
  const m = out.match(/(\d+) change\(s\)(?:, (\d+) detected change\(s\))?/)
  return { pending: m ? +m[1] : 0, detected: m?.[2] ? +m[2] : 0 }
}

// Write commands open a GUI dialog without /noprompt and hang a non-interactive shell.
export const needsNoprompt = (cmd: string) =>
  /\btf(\.exe)?["']?\s+(checkin|merge|resolve|get|undo|shelve|unshelve)\b/i.test(cmd) && !/\/noprompt\b/i.test(cmd)

const advice = ({ pending, detected }: { pending: number; detected: number }) =>
  [
    pending > 0
      ? `📝 ${pending} 個待簽入變更：先看 \`tf status\` / \`tf diff\`，再請 Claude 指定路徑簽入（\`tf checkin <路徑> /comment:"…" /noprompt\`）。`
      : '✅ 沒有待簽入變更。',
    detected > 0 &&
      `🔍 ${detected} 個新增/刪除只算 detected，不會被簽入；要簽入的先 \`tf add\` / \`tf delete\`。`,
    '⬇️ 開工前執行 `/tf get` 取得最新版。',
    '🔀 要合併分支：請 Claude 執行 `tf merge <來源> <目標> /recursive`，再 `tf resolve /auto:AutoMerge /noprompt`。',
  ]
    .filter(Boolean)
    .join('\n')

const RULES = `This session is inside a TFVC workspace (Azure DevOps). Use \`tf\` (on PATH), not git.
- Write commands (checkin, merge, resolve, get, undo) must carry /noprompt or they open a GUI dialog.
- Local workspace: edits are pending automatically; new/deleted files are only "detected" until \`tf add\`/\`tf delete\`.
- Check in by explicit path, never the whole workspace root; show the user the file list and comment first.
- \`tf resolve /auto:\` only picks a whole side (AutoMerge, KeepYours, TakeTheirs); line-level conflicts need the user's merge tool.`

async function loadWorkspaces($: Engine): Promise<Workspace[]> {
  const base = await $.env.get('LOCALAPPDATA')
  if (!base) return []
  const root = `${base}\\Microsoft\\Team Foundation`
  const out: Workspace[] = []
  for (const ver of await $.fs.list(root).catch(() => [])) {
    const vol = `${root}\\${ver.name}\\Cache\\Volatile`
    for (const d of await $.fs.list(vol).catch(() => [])) {
      const xml = await $.fs.read(`${vol}\\${d.name}\\VersionControl.config`).catch(() => '')
      if (typeof xml === 'string') out.push(...parseWorkspaces(xml))
    }
  }
  return out
}

const tf = ($: Engine, args: string[], cwd: string, timeoutMs: number) =>
  $.process.run(['tf', ...args], { cwd, timeoutMs }).catch(() => undefined)

const NO_TF = '找不到 `tf`。請重開 Claude Code 讓新的 PATH 生效（見 local-environment.md）。'

export const register: Register = on => {
  let hit: Hit | undefined

  on('session.start', async ($, e, next) => {
    hit = findWorkspace(e.cwd, await loadWorkspaces($))
    if (!hit) return next(e)

    await $.command.register({
      name: 'tf',
      description: 'TFVC：狀態與建議（/tf）、取得最新版（/tf get）',
      argumentHint: '[status|get]',
    })
    $.ui.status(`TFVC · ${hit.name}`)
    void tf($, ['status', '.', '/recursive', '/format:brief'], e.cwd, 120_000).then(r => {
      if (!r) return
      const { pending, detected } = countStatus(r.stdout)
      if (pending + detected > 0) $.ui.toast(`TFVC：${pending} 個待簽入、${detected} 個 detected，輸入 /tf 看建議`)
    })
    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    return hit ? { sections: [...r.sections, { id: 'tfvc:rules', text: RULES, scope: 'session' }] } : r
  })

  on('command.run', { command: 'tf' }, async ($, e) => {
    const cwd = await $.session.cwd()
    if (e.args.trim() === 'get') {
      const r = await tf($, ['get', '.', '/recursive', '/noprompt'], cwd, 600_000)
      if (!r) return { text: NO_TF }
      const body = (r.stdout + r.stderr).trim().split(/\r?\n/).slice(-15).join('\n')
      const conflict = /conflict/i.test(body) ? '\n\n⚠️ 有衝突：請 Claude 用 `tf resolve` 處理，或在 VS2017 解決。' : ''
      return { text: `⬇️ tf get（exit ${r.exitCode}）\n${body || 'All files are up to date.'}${conflict}` }
    }
    const r = await tf($, ['status', '.', '/recursive', '/format:brief'], cwd, 120_000)
    if (!r) return { text: NO_TF }
    return { text: `TFVC · ${hit?.name ?? '?'}（${cwd}）\n${advice(countStatus(r.stdout))}` }
  })

  const guard = (cmd: string) =>
    hit && needsNoprompt(cmd) ? { deny: 'tfvc: add /noprompt to this tf command, or it opens a GUI dialog and hangs.' } : undefined

  on('tool.call', { tool: 'Bash' }, ($, e, next) => guard(e.command) ?? next(e))
  on('tool.call', { tool: 'PowerShell' }, ($, e, next) => guard(e.command) ?? next(e))
}
