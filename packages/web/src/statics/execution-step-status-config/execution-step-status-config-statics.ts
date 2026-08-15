/**
 * PURPOSE: Defines role colors and step status display configuration for the execution view
 *
 * USAGE:
 * executionStepStatusConfigStatics.statusConfig.in_progress.label;
 * // Returns 'RUNNING'
 */

export const executionStepStatusConfigStatics = {
  roleColors: {
    chaoswhisperer: 'primary',
    glyphsmith: 'primary',
    bughunt: 'primary',
    tavernkeeper: 'primary',
    riftcarver: 'loot-rare',
    codeweaver: 'primary',
    ward: 'warning',
    spiritmender: 'primary',
    flowrider: 'primary',
    groundstomper: 'primary',
    siegemaster: 'primary',
    blightscout: 'primary',
    pesteater: 'primary',
    warpgate: 'primary',
  },
  statusConfig: {
    queued: { label: 'QUEUED', color: 'text-dim', symbol: '···' },
    pending: { label: 'PENDING', color: 'text-dim', symbol: '···' },
    in_progress: { label: 'RUNNING', color: 'primary', symbol: '▶' },
    complete: { label: 'DONE', color: 'success', symbol: '✓' },
    failed: { label: 'FAILED', color: 'danger', symbol: '✗' },
    partially_complete: { label: 'PARTIAL', color: 'warning', symbol: '◇' },
    blocked: { label: 'BLOCKED', color: 'warning', symbol: '■' },
    skipped: { label: 'SKIPPED', color: 'text-dim', symbol: '⊘' },
  },
} as const;
