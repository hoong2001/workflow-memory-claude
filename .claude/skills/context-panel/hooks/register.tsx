import { atom, read, update } from 'claude-code'
import type { ContextBreakdownDetail, EngineInterface, Register } from 'claude-code'

import type { Breakdown, Snapshot } from '../types'

const PANE = 'context-panel'
const snap = atom({ plugin: 'context-panel', key: 'snap' } as const, null)
const isShown = atom({ plugin: 'context-panel', key: 'isShown' } as const, false) // hidden at session start; the mod-panel toggle or /context-panel shows it
const sections = atom({ plugin: 'context-panel', key: 'sections' } as const, [])

export const fmt = (n: number) =>
  n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : `${n}`

// /context's style: 23% · 2.1% · <0.1%
export const pct = (n: number, of: number) => {
  const p = of > 0 ? (n / of) * 100 : 0
  return p >= 10 ? `${Math.round(p)}%` : p >= 0.1 ? `${+p.toFixed(1)}%` : '<0.1%'
}

// Cells of a `width`-wide bar per category: every used one gets at least one, free space takes the rest.
export function barCells(b: Pick<Breakdown, 'categories' | 'rawMaxTokens'>, width: number) {
  const cells = b.categories
    .filter(c => c.kind !== 'deferred' && c.kind !== 'free' && c.tokens > 0)
    .map(c => ({ c, n: Math.max(1, Math.round((c.tokens / b.rawMaxTokens) * width)) }))
  const free = Math.max(0, width - cells.reduce((s, x) => s + x.n, 0))
  const buffer = cells.findIndex(x => x.c.kind === 'buffer')
  if (buffer >= 0) cells.push(...cells.splice(buffer, 1)) // buffer sits at the far end, after the free space

  return { used: cells.filter(x => x.c.kind !== 'buffer'), free, buffer: cells.find(x => x.c.kind === 'buffer') }
}

async function refresh($: EngineInterface, detail?: ContextBreakdownDetail) {
  const { context } = await $.session.usage(detail ? { breakdown: detail } : undefined)
  await update($, snap, old => ({
    tokens: context.tokens,
    window: context.window,
    percent: context.percent,
    breakdown: context.breakdown ?? old?.breakdown ?? null,
    detail: detail ?? old?.detail,
  }))
}

// A pane, not the band above the prompt: the band holds one plugin's tree, so two mods there hide each other.
// Docked as a sidebar in the fullscreen layout; inline above the prompt otherwise.
async function show($: EngineInterface) {
  await update($, isShown, () => true)
  await $.ui.open({ id: PANE, title: 'Context' })
  await refresh($, 'full')
}

async function hide($: EngineInterface) {
  await update($, isShown, () => false)
  await $.ui.close({ id: PANE })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'context-panel',
      description: 'Show or hide the live /context panel',
      argumentHint: '[show|hide]',
    })
    if (await read($, isShown)) void show($)

    return next(e)
  })

  // `show` / `hide` for the mod-panel buttons; no argument toggles
  on('command.run', { command: 'context-panel' }, async ($, e) => {
    const arg = e.args.trim()
    const shown = arg === 'show' ? true : arg === 'hide' ? false : !(await read($, isShown))
    if (!shown) {
      await hide($)
      return { text: 'Context panel hidden.' }
    }
    await show($)
    return { text: 'Context panel shown.' }
  })

  // the person's close mark counts as Hide, so the next session start keeps it closed
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') await update($, isShown, () => false)
    return next(e)
  }).catch(($, e, next) => (next.called ? undefined : next(e))) // a failed hook never keeps the pane open

  // after every turn while shown: a local estimate (no API calls); Show / ↻ count exactly
  on('session.measure', async ($, e, next) => {
    if (await read($, isShown)) await refresh($, 'summary')
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const b = (await read($, snap))?.breakdown
    const open = await read($, sections)

    const header = (
      <Box justifyContent="space-between">
        <Text>
          <Text color="claude">◆ </Text>
          <Text bold>context</Text>
        </Text>
        <Box>
          {b && (
            <Text dimColor>
              {fmt(b.totalTokens)} of {fmt(b.rawMaxTokens)}
              {b.isAutoCompactEnabled && b.autoCompactThreshold ? ` · compacts at ${fmt(b.autoCompactThreshold)}` : ''}{' '}
            </Text>
          )}
          <Button key="refresh" label="↻" plain dimColor onPress={() => refresh($, 'full')} />
        </Box>
      </Box>
    )

    if (!b) {
      return (
        <Box flexDirection="column">
          {header}
          <Text dimColor>measuring...</Text>
        </Box>
      )
    }

    const max = b.rawMaxTokens
    const bar = barCells(b, Math.max(10, e.props.bodyColumns))
    const free = b.categories.find(c => c.kind === 'free')

    const lists: { id: string; title: string; rows: [string, number][] }[] = [
      { id: 'mcp', title: `mcp tools ${b.mcpTools.length}`, rows: b.mcpTools.map(t => [`${t.name}${t.isLoaded ? '' : ' (deferred)'}`, t.tokens]) },
      { id: 'agents', title: `agents ${b.agents.length}`, rows: b.agents.map(a => [`${a.agentType} · ${a.source}`, a.tokens]) },
      { id: 'memory', title: `memory ${b.memoryFiles.length}`, rows: b.memoryFiles.map(m => [m.path, m.tokens]) },
      {
        id: 'skills',
        title: `skills ${b.skills?.includedSkills ?? 0}/${b.skills?.totalSkills ?? 0}`,
        rows: (b.skills?.skillFrontmatter ?? []).map(k => [`${k.name} · ${k.pluginName ?? k.source}`, k.tokens]),
      },
    ].filter(l => l.rows.length > 0)
    const toggle = (id: string) =>
      update($, sections, list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]))

    return (
      <Box flexDirection="column">
        {header}
        <Text>
          {bar.used.map(x => (
            <Text color={x.c.color}>{'█'.repeat(x.n)}</Text>
          ))}
          <Text dimColor>{'░'.repeat(bar.free)}</Text>
          {bar.buffer && <Text color="inactive">{'█'.repeat(bar.buffer.n)}</Text>}
        </Text>
        <Box flexWrap="wrap" columnGap={3}>
          {bar.used.map(({ c }) => (
            <Text>
              <Text color={c.color}>■</Text> {c.name.toLowerCase()} <Text bold>{fmt(c.tokens)}</Text>{' '}
              <Text dimColor>{pct(c.tokens, max)}</Text>
            </Text>
          ))}
        </Box>
        <Box flexWrap="wrap" columnGap={3}>
          {free && (
            <Text dimColor>
              — {free.name.toLowerCase()} <Text bold>{fmt(free.tokens)}</Text>
            </Text>
          )}
          {bar.buffer && (
            <Text>
              <Text color="inactive">█</Text> <Text dimColor>{bar.buffer.c.name.toLowerCase()}</Text>{' '}
              <Text bold>{fmt(bar.buffer.c.tokens)}</Text>
            </Text>
          )}
          {lists.map(l => (
            <Button key={`sec-${l.id}`} plain dimColor onPress={() => toggle(l.id)}>
              {open.includes(l.id) ? '▾' : '▸'} {l.title}
            </Button>
          ))}
        </Box>
        {lists
          .filter(l => open.includes(l.id))
          .map(l => (
            <Box flexDirection="column" marginTop={1}>
              <Text bold>{l.title}</Text>
              <Box flexWrap="wrap" columnGap={3}>
                {l.rows.map(([name, tokens]) => (
                  <Text>
                    {name} <Text dimColor>{fmt(tokens)}</Text>
                  </Text>
                ))}
              </Box>
            </Box>
          ))}
      </Box>
    )
  })
}
