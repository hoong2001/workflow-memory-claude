import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { parseLivePlans } from './parse'

const plans = atom({ plugin: 'plan-status', key: 'plans' } as const, 'missing')
const isShown = atom({ plugin: 'plan-status', key: 'isShown' } as const, true) // shown on every session start / resume until Hide

// The file is rebuilt by the project's own PostToolUse hook (.claude/hooks/project-memory-status.mjs);
// this mod only reads it, and only in the table format parse.ts knows.
async function refresh($: EngineInterface) {
  const root = await $.session.root()
  const text = await $.fs.read(`${root}/project-memory/project-memory-status.md`).catch(() => null)
  await update($, plans, () => (typeof text === 'string' ? parseLivePlans(text) : 'missing'))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'plan-status',
      description: 'Show or hide the live plans band',
    })
    await refresh($)
    return next(e)
  })

  on('command.run', { command: 'plan-status' }, async $ => {
    const shown = await read($, isShown)
    await update($, isShown, () => !shown)
    if (!shown) await refresh($)
    return { text: shown ? 'Plan status hidden.' : 'Plan status shown.' }
  })

  // /resume and /clear switch to a new session id in the same process: its state starts empty and
  // session.start does not fire again, but the classic SessionStart hook does.
  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'resume' || e.source === 'clear') await refresh($)
    return next(e)
  }).catch(($, e, next) => (next.called ? undefined : next(e)))

  // A plan written during the turn has already regenerated the file by the time the turn ends.
  on('turn.complete', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, plans)
    if (e.props.hasSurvey || list === 'missing') return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    if (list === 'unknown-format') {
      return (
        <Box>
          <Text color="warning">
            📋 project-memory-status.md table format not recognised — update the plan-status mod or
            run node .claude/hooks/project-memory-status.mjs --regenerate
          </Text>
        </Box>
      )
    }
    if (!(await read($, isShown))) {
      return (
        <Box>
          <Text>📋 </Text>
          <Button key="toggle" label={`plans ${list.length}`} plain dimColor onPress={() => update($, isShown, () => true)} />
        </Box>
      )
    }
    const hide = () => update($, isShown, () => false)

    if (list.length === 0) {
      return (
        <Box>
          <Text dimColor>📋 No live plans</Text>
        </Box>
      )
    }

    const room = Math.max(1, e.props.maxRows - 2)
    return (
      <Box flexDirection="column">
        <Box>
          <Text bold>📋 {list.length} live plan(s) — oldest first </Text>
          <Button key="toggle" label="Hide" plain dimColor onPress={hide} />
        </Box>
        {list.slice(0, room).map(p => (
          <Text>
            {'  '}
            {p.module} · {p.plan} · <Text color="warning">{p.status}</Text>
            {p.detail ? ` · ${p.detail}` : ''} <Text dimColor>{p.updated}</Text>
          </Text>
        ))}
        {list.length > room && <Text dimColor>  … {list.length - room} more</Text>}
      </Box>
    )
  })
}
