/**
 * PURPOSE: Defines role colors and step status display configuration for the execution view
 *
 * USAGE:
 * executionStepStatusConfigStatics.statusConfig.in_progress.label;
 * // Returns 'RUNNING'
 */

export const executionStepStatusConfigStatics = {
  roleColors: {
    pathseeker: 'primary',
    codeweaver: 'primary',
    ward: 'warning',
    spiritmender: 'primary',
    siegemaster: 'primary',
    lawbringer: 'primary',
  },
  statusConfig: {
    queued: { label: 'QUEUED', color: 'text-dim', symbol: '···' },
    pending: { label: 'PENDING', color: 'text-dim', symbol: '···' },
    in_progress: { label: 'RUNNING', color: 'primary', symbol: '▶' },
    complete: { label: 'DONE', color: 'success', symbol: '✓' },
    failed: { label: 'FAILED', color: 'danger', symbol: '✗' },
    partially_complete: { label: 'PARTIAL', color: 'warning', symbol: '◇' },
    blocked: { label: 'BLOCKED', color: 'warning', symbol: '■' },
  },
} as const;
