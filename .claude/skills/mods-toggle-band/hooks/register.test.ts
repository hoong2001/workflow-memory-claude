import { expect, test } from 'claude-code/testing'

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a toggle runs hide when its mod is shown and show when it is not, on ${surface}`, async ($, on) => {
    const ran: string[] = []
    on('state.get', ($, e, next) =>
      e.plugin === 'mods-plan-status' && e.key === 'isShown' ? { value: { value: true, version: 1 } } : next(e),
    )
    on('command.run', ($, e) => {
      ran.push(`${e.command} ${e.args}`)
      return { value: {} }
    })
    const band = await $.ui.mount({ plugin: 'mods-toggle-band', surface, component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80, scroll: { offset: 0, bodyRows: 10 }, view: {}, title: '', isFocused: false },
    })
    await band.press({ key: 'toggle-mods-plan-status' })
    await band.press({ key: 'toggle-mods-context-panel' })
    expect(ran).toEqual(['mods-plan-status hide', 'mods-context-panel show'])
  })
}
