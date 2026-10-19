import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren } from 'claude-code'

import { parseLivePlans } from './parse'

const PANE = 'mods-plan-status'
const plans = atom({ plugin: 'mods-plan-status', key: 'plans' } as const, 'missing')
const isShown = atom({ plugin: 'mods-plan-status', key: 'isShown' } as const, false) // hidden at session start until /mods-plan-status show

// The file is rebuilt by the project's own PostToolUse hook (.claude/hooks/project-memory-status.mjs);
// this mod only reads it, and only in the table format parse.ts knows.
async function refresh($: EngineInterface) {
  const root = await $.session.root()
  const text = await $.fs.read(`${root}/project-memory/project-memory-status.md`).catch(() => null)
  await update($, plans, () => (typeof text === 'string' ? parseLivePlans(text) : 'missing'))
}

// A pane, not the band above the prompt: the band holds one plugin's tree, so two mods there hide each other.
// Docked as a sidebar in the fullscreen layout; inline above the prompt otherwise.
async function setShown($: EngineInterface, shown: boolean) {
  await update($, isShown, () => shown)
  if (!shown) return $.ui.close({ id: PANE })
  await refresh($)
  if ((await read($, plans)) !== 'missing') await $.ui.open({ id: PANE, title: 'Plans' })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'mods-plan-status',
      description: 'Show or hide the live plans pane',
      argumentHint: '[show|hide]',
    })
    if (await read($, isShown)) void setShown($, true)
    return next(e)
  })

  // `show` / `hide` for the mods-toggle-band buttons; no argument toggles
  on('command.run', { command: 'mods-plan-status' }, async ($, e) => {
    const arg = e.args.trim()
    const shown = arg === 'show' ? true : arg === 'hide' ? false : !(await read($, isShown))
    await setShown($, shown)
    return { text: shown ? 'Plan status shown.' : 'Plan status hidden.' }
  })

  // the person's close mark counts as Hide, so the next session start keeps it closed
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') await update($, isShown, () => false)
    return next(e)
  }).catch(($, e, next) => (next.called ? undefined : next(e))) // a failed hook never keeps the pane open

  // /resume and /clear switch to a new session id in the same process: its state starts empty and
  // session.start does not fire again, but the classic SessionStart hook does.
  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'resume' || e.source === 'clear') await setShown($, await read($, isShown))
    return next(e)
  }).catch(($, e, next) => (next.called ? undefined : next(e)))

  // A plan written during the turn has already regenerated the file by the time the turn ends.
  on('turn.complete', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, plans)

    if (list === 'missing') return <Text dimColor>No project-memory/project-memory-status.md here.</Text>
    if (list === 'unknown-format') {
      return (
        <Text color="warning">
          project-memory-status.md table format not recognised — update the mods-plan-status mod or run node
          .claude/hooks/project-memory-status.mjs --regenerate
        </Text>
      )
    }
    if (list.length === 0) return <Text dimColor>No live plans</Text>

    // An ordered list, oldest first: [ @ ] and the full plan name, then • status, • You now, • Next.
    // The marker sits in its own column, so a wrapped line stays aligned under its own text.
    const row = (marker: string, content: RenderChildren) => (
      <Box flexDirection="row">
        <Text dimColor>{marker}</Text>
        <Box flexShrink={1}>{content}</Box>
      </Box>
    )
    const width = String(list.length).length
    const bullet = ' '.repeat(width + 2) + '• '

    return (
      <Box flexDirection="column">
        <Text bold>{list.length} live plan(s) — oldest first</Text>
        <Box flexDirection="column" marginTop={1}>
          {list.map((p, i) => {
            const title = <Text bold>{p.plan}</Text>
            const leaves = [
              <Text>
                <Text color="warning">{p.status}</Text>
                {p.detail ? ` · ${p.detail}` : ''}
                <Text dimColor>{p.updated ? ` · ${p.updated}` : ''}</Text>
              </Text>,
              p.youNow ? <Text>You now: {p.youNow}</Text> : null,
              p.next ? <Text>Next: {p.next}</Text> : null,
            ].filter(leaf => leaf !== null)
            return (
              <Box flexDirection="column">
                {row(
                  `${String(i + 1).padStart(width)}. `,
                  p.path ? (
                    // [ @ ] first, at a fixed width, so a long name wraps under itself instead of pushing the button around;
                    // a press puts `@<path> ` in the prompt box at the cursor
                    <Box flexDirection="row">
                      <Button
                        key={p.path}
                        label="@"
                        variant="primary"
                        onPress={() => void $.prompt.fill({ text: `@${p.path} `, mode: 'insert' })}
                      />
                      <Text> </Text>
                      <Box flexShrink={1}>{title}</Box>
                    </Box>
                  ) : (
                    title
                  ),
                )}
                {leaves.map(leaf => row(bullet, leaf))}
              </Box>
            )
          })}
        </Box>
      </Box>
    )
  })
}
