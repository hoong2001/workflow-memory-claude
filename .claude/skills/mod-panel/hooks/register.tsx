import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const isShown = atom({ plugin: 'mod-panel', key: 'isShown' } as const, true) // the band itself; /mod-panel toggles it

// Each mod owns its pane and answers `/<command> show|hide`; this band only reads their `isShown`
// (any plugin may read any value) and runs those commands. Add a row when a new mod gets a pane.
const planStatusShown = { plugin: 'plan-status', key: 'isShown' } as const
const contextPanelShown = { plugin: 'context-panel', key: 'isShown' } as const
export const MODS = [
  { command: 'plan-status', label: 'Plans' },
  { command: 'context-panel', label: 'Context' },
]

async function run($: EngineInterface, command: string, args: 'show' | 'hide') {
  // plan-status is project-scoped: elsewhere its command does not exist
  await $.command.run({ command, args }).catch(() => $.ui.toast(`/${command} is not loaded in this session`))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'mod-panel', description: 'Show or hide the mod toggle band above the prompt' })
    return next(e)
  })

  on('command.run', { command: 'mod-panel' }, async $ => {
    const shown = !(await read($, isShown))
    await update($, isShown, () => shown)
    return { text: shown ? 'Mod panel shown.' : 'Mod panel hidden.' }
  })

  // The band holds one plugin's tree; the other mods draw panes, so this one can take it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isShown))) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    // undefined = that mod is not loaded here: drawn off
    const states = [(await $.state.get(planStatusShown)).value, (await $.state.get(contextPanelShown)).value]
    return (
      <Box columnGap={1}>
        <Text dimColor>Mods</Text>
        {MODS.map((m, i) => {
          const isOn = states[i] === true
          return (
            <Button
              key={`toggle-${m.command}`}
              label={`${isOn ? '●' : '○'} ${m.label}`}
              variant={isOn ? 'primary' : 'secondary'}
              dimColor={!isOn}
              onPress={() => run($, m.command, isOn ? 'hide' : 'show')}
            />
          )
        })}
      </Box>
    )
  })
}
