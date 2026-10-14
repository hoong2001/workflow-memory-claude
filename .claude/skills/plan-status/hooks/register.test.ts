import { expect, test } from 'claude-code/testing'

import { TABLE_FORMAT } from './parse'

const md = [
  '## Live work — 1 plan(s) not Done',
  '',
  TABLE_FORMAT,
  '',
  '| Module | Plan | Status | Detail | Updated |',
  '|---|---|---|---|---|',
  '| orders | [orders-export.md](x) | Building | 2/5 | 2026-10-01 |',
].join('\n')

for (const surface of ['terminal', 'desktop'] as const) {
  test(`band is shown by default and Hide / 📋 plans toggle it on ${surface}`, async ($, on) => {
    on('session.root', () => ({ value: '/proj' }))
    on('fs.read', () => ({ value: md }))
    on('classic.SessionStart', () => ({}))
    await $.classic.SessionStart({ source: 'clear' }) // runs refresh, as /clear does in a session
    const band = await $.ui.mount({
      plugin: 'plan-status',
      surface,
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 20 } },
    })
    expect(await band.find({ key: 'toggle', text: 'Hide' })).toBeDefined()
    await band.press({ key: 'toggle' })
    expect(await band.find({ key: 'toggle', text: 'plans 1' })).toBeDefined()
    await band.press({ key: 'toggle' })
    expect(await band.find({ key: 'toggle', text: 'Hide' })).toBeDefined()
  })
}
