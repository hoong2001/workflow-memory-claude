import { expect, test } from 'claude-code/testing'

import { parseLivePlans, TABLE_FORMAT } from './parse'

// Shaped exactly as .claude/hooks/project-memory-status.mjs render() writes it.
const generated = (rows: string[]) =>
  [
    '## Live work — 2 plan(s) not Done',
    '',
    TABLE_FORMAT,
    '',
    'Oldest first — the most-forgotten plan floats to the top.',
    '',
    '| Module | Plan | Status | Detail | Updated |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n')

test('reads the live-plan rows the generator writes', async () => {
  const md = generated([
    '| orders | [orders-2026-10-01-export.md](modules/orders/plans/orders-2026-10-01-export.md) | Building | 2/5 | 2026-10-01 |',
    '| stock | [stock-a\\|b.md](x) | Blocked | waits on DBA |  |',
  ])
  expect(parseLivePlans(md)).toEqual([
    { module: 'orders', plan: 'orders-2026-10-01-export.md', status: 'Building', detail: '2/5', updated: '2026-10-01' },
    { module: 'stock', plan: 'stock-a|b.md', status: 'Blocked', detail: 'waits on DBA', updated: '' },
  ])
})

test('no live plans is an empty list', async () => {
  expect(parseLivePlans(`${TABLE_FORMAT}\n\nNothing live.`)).toEqual([])
})

test('refuses a file without the marker or with a changed row shape', async () => {
  expect(parseLivePlans('| Module | Plan |\n| a | b | c | d | e |')).toBe('unknown-format')
  expect(parseLivePlans(generated(['| a | b | c | d |']))).toBe('unknown-format')
  expect(parseLivePlans(generated(['| a | b | c | d | e | f |']))).toBe('unknown-format')
})
