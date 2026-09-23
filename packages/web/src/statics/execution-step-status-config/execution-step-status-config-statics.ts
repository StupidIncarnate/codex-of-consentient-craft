/**
 * PURPOSE: Defines role colors, per-step colors, and step status display configuration for the
 * execution view. `stepColors` is keyed on `agentFlowStatics[family].steps` names
 * (`packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts`), read-only from `web` —
 * this package has no dependency on `@dungeonmaster/orchestrator`, so the key set is a hand-copy
 * rather than an import, pinned by this file's own colocated test. `executionRowDisplayResolveTransformer`
 * resolves the STEP colour before falling back to the ROLE colour below: a `ward` step inside a
 * codeweaver scope should read as a ward gate (`warning`), not as codeweaver's own colour.
 *
 * USAGE:
 * executionStepStatusConfigStatics.statusConfig.in_progress.label;
 * // Returns 'RUNNING'
 * executionStepStatusConfigStatics.stepColors.ward;
 * // Returns 'warning'
 */

export const executionStepStatusConfigStatics = {
  roleColors: {
    chaoswhisperer: 'primary',
    bughunt: 'primary',
    tavernkeeper: 'primary',
    riftcarver: 'loot-rare',
    codeweaver: 'primary',
    ward: 'warning',
    spiritmender: 'primary',
    flowrider: 'primary',
    siegemaster: 'primary',
    warpgate: 'primary',
  },
  stepColors: {
    plan: 'text',
    work: 'primary',
    repair: 'primary',
    fixHappy: 'primary',
    fixAdversarial: 'primary',
    recipe: 'primary',
    read: 'primary',
    merge: 'primary',
    review: 'loot-gold',
    happyWalk: 'loot-gold',
    adversarial: 'loot-gold',
    ward: 'warning',
    gate: 'warning',
    carve: 'loot-rare',
    commit: 'loot-rare',
    sweepIn: 'loot-rare',
    sweepOut: 'loot-rare',
  },
  statusConfig: {
    queued: { label: 'QUEUED', color: 'text-dim', symbol: '···' },
    pending: { label: 'PENDING', color: 'text-dim', symbol: '···' },
    in_progress: { label: 'RUNNING', color: 'primary', symbol: '▶' },
    complete: { label: 'DONE', color: 'success', symbol: '✓' },
    failed: { label: 'FAILED', color: 'danger', symbol: '✗' },
    blocked: { label: 'BLOCKED', color: 'warning', symbol: '■' },
    skipped: { label: 'SKIPPED', color: 'text-dim', symbol: '⊘' },
  },
} as const;
