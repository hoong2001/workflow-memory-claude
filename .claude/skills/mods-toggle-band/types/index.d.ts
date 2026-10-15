export type ModShown = boolean

declare module 'claude-code' {
  interface PluginState {
    'mods-toggle-band': { isShown: ModShown }
    // read-only mirrors of the keys this band reads; each owner's contract declares the same type
    'mods-plan-status': { isShown: boolean }
    'mods-context-panel': { isShown: boolean }
  }
}
