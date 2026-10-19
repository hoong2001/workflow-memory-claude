import type { LivePlan } from '../types'

// The one table format this parser knows. The generator, .claude/hooks/project-memory-status.mjs,
// writes the same marker (its TABLE_FORMAT) above the table; change both together.
export const TABLE_FORMAT = '<!-- plan-status-table v3 -->'

// Rows read as | Module | Plan | Status | Detail | You now | Next | Updated |, Plan as [file](link), `|` escaped as `\|`.
// Returns 'unknown-format' when the marker is missing or names another version, so a changed
// generator shows a warning instead of misread rows.
export function parseLivePlans(markdown: string): LivePlan[] | 'unknown-format' {
  const lines = markdown.split(/\r?\n/)
  if (!lines.some(line => line.trim() === TABLE_FORMAT)) return 'unknown-format'

  const plans: LivePlan[] = []
  for (const line of lines) {
    if (!line.startsWith('|') || line.startsWith('|---') || line.startsWith('| Module |')) continue
    const body = line.trimEnd()
    const cells = body
      .slice(1, body.endsWith('|') ? -1 : undefined)
      .split(/(?<!\\)\|/)
      .map(cell => cell.trim().replace(/\\\|/g, '|'))
    if (cells.length !== 7) return 'unknown-format'
    const [module, plan, status, detail, youNow, next, updated] = cells
    const link = plan.match(/^\[(.*)\]\((.*)\)$/)
    // links are relative to project-memory/, where the status file lives
    const path = link ? `project-memory/${link[2]}` : ''
    plans.push({ module, plan: link ? link[1] : plan, path, status, detail, youNow, next, updated })
  }
  return plans
}
