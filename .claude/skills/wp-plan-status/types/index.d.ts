export type LivePlan = {
  module: string
  plan: string
  status: string
  detail: string
  updated: string
}

declare module 'claude-code' {
  interface PluginState {
    'plan-status': {
      // 'missing' = no project-memory/project-memory-status.md here: draw nothing
      plans: LivePlan[] | 'missing' | 'unknown-format'
      isCollapsed: boolean
    }
  }
}
