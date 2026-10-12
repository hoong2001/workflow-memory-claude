import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { parseLivePlans } from './parse'

const plans = atom({ plugin: 'plan-status', key: 'plans' } as const, 'missing')
const isCollapsed = atom({ plugin: 'plan-status', key: 'isCollapsed' } as const, false)

// The file is rebuilt by the project's own PostToolUse hook (.claude/hooks/project-memory-status.mjs);
// this mod only reads it, and only in the table format parse.ts knows.
async function refresh($: EngineInterface) {
  const root = await $.session.root()
  const text = await $.fs.read(`${root}/project-memory/project-memory-status.md`).catch(() => null)
  await update($, plans, () => (typeof text === 'string' ? parseLivePlans(text) : 'missing'))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

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
    const collapsed = await read($, isCollapsed)
    const toggle = () => update($, isCollapsed, value => !value)

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
          <Text bold>📋 {list.length} live plan(s){collapsed ? '' : ' — oldest first'} </Text>
          <Button key="toggle" label={collapsed ? 'Show' : 'Hide'} onPress={toggle} />
        </Box>
        {!collapsed &&
          list.slice(0, room).map(p => (
            <Text>
              {'  '}
              {p.module} · {p.plan} · <Text color="warning">{p.status}</Text>
              {p.detail ? ` · ${p.detail}` : ''} <Text dimColor>{p.updated}</Text>
            </Text>
          ))}
        {!collapsed && list.length > room && <Text dimColor>  … {list.length - room} more</Text>}
      </Box>
    )
  })
}
