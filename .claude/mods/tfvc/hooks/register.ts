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

// The /tf choice dialog: at most 4 options (the dialog's cap), decline always last.
// `ask` = a prompt handed to Claude, which still shows the file list and waits for a go before any write.
export const DECLINE = 'No thanks'
export const GET = '⬇️ Get latest'
export const choices = ({ pending, detected }: { pending: number; detected: number }) =>
  [
    pending > 0 && {
      label: `📝 Check in ${pending} change(s)`,
      ask: 'List the pending TFVC changes and suggest a comment; run tf checkin (explicit paths, /noprompt) only after I confirm the files and the comment.',
    },
    detected > 0 && {
      label: `🔍 Handle ${detected} detected`,
      ask: 'List the TFVC detected adds/deletes and suggest which need tf add / tf delete; run them only after I confirm.',
    },
    { label: GET },
    { label: DECLINE },
  ].filter((c): c is { label: string; ask?: string } => !!c)

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

const NO_TF = '`tf` not found. Restart Claude Code so a newly added PATH entry takes effect.'

async function getLatest($: Engine, cwd: string) {
  const r = await tf($, ['get', '.', '/recursive', '/noprompt'], cwd, 600_000)
  if (!r) return { text: NO_TF }
  const body = (r.stdout + r.stderr).trim().split(/\r?\n/).slice(-15).join('\n')
  const conflict = /conflict/i.test(body) ? '\n\n⚠️ Conflicts: ask Claude to run `tf resolve`, or resolve them in Visual Studio.' : ''
  return { text: `⬇️ tf get (exit ${r.exitCode})\n${body || 'All files are up to date.'}${conflict}` }
}

export const register: Register = on => {
  let hit: Hit | undefined

  on('session.start', async ($, e, next) => {
    hit = findWorkspace(e.cwd, await loadWorkspaces($))
    if (!hit) return next(e)

    await $.command.register({
      name: 'tf',
      description: 'TFVC: status and next actions (/tf), get latest (/tf get)',
      argumentHint: '[status|get]',
    })
    $.ui.status(`TFVC · ${hit.name}`)
    void tf($, ['status', '.', '/recursive', '/format:brief'], e.cwd, 120_000).then(r => {
      if (!r) return
      const { pending, detected } = countStatus(r.stdout)
      if (pending + detected > 0) $.ui.toast(`TFVC: ${pending} pending, ${detected} detected — type /tf for actions`)
    })
    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    return hit ? { sections: [...r.sections, { id: 'tfvc:rules', text: RULES, scope: 'session' }] } : r
  })

  on('command.run', { command: 'tf' }, async ($, e) => {
    const cwd = await $.session.cwd()
    if (e.args.trim() === 'get') return getLatest($, cwd)
    const r = await tf($, ['status', '.', '/recursive', '/format:brief'], cwd, 120_000)
    if (!r) return { text: NO_TF }
    const { pending, detected } = countStatus(r.stdout)
    const head = `TFVC · ${hit?.name ?? '?'}: ${pending} pending, ${detected} detected`
    const opts = choices({ pending, detected })
    // Dismissed (Esc) counts as declined; "Other" free text (e.g. a merge request) goes to Claude as typed.
    const pick = await $.ui.ask(`${head}. What next?`, { header: 'TFVC', options: opts.map(o => o.label) }).catch(() => DECLINE)
    if (pick === DECLINE) return { text: `${head} — skipped.` }
    if (pick === GET) return getLatest($, cwd)
    const ask = opts.find(o => o.label === pick)?.ask
    void $.prompt.submit({ text: ask ?? pick, asUser: true })
    return { text: head }
  })

  const guard = (cmd: string) =>
    hit && needsNoprompt(cmd) ? { deny: 'tfvc: add /noprompt to this tf command, or it opens a GUI dialog and hangs.' } : undefined

  on('tool.call', { tool: 'Bash' }, ($, e, next) => guard(e.command) ?? next(e))
  on('tool.call', { tool: 'PowerShell' }, ($, e, next) => guard(e.command) ?? next(e))
}
