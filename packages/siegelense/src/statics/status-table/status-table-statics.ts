/**
 * PURPOSE: Defines immutable column headers and formatting constants for the status fleet table,
 * plus the `--since` window vocabulary `statusAnswerRenderTransformer`'s empty-fleet sentence reads
 * to name the active filter and suggest the widest one. `widest` names which member of `order` that
 * suggestion jumps to — always the top of the range, never the next incremental step, matching how a
 * caller actually escapes an empty fleet (widen all the way, not by 4x at a time) — so landing a new
 * top window here is the one edit that sentence needs.
 *
 * USAGE:
 * statusTableStatics.table.headers;
 * // Returns ['ID', 'STATE', 'SPEC', 'BRANCH', 'UPTIME', 'LAST BEAT', 'RUNS', 'RSS', 'ORPHANS']
 *
 * statusTableStatics.table.cellPadding;
 * // Returns 2
 *
 * statusTableStatics.sinceWindows.display['6h'];
 * // Returns '6hr'
 */

export const statusTableStatics = {
  table: {
    headers: [
      'ID',
      'STATE',
      'SPEC',
      'BRANCH',
      'UPTIME',
      'LAST BEAT',
      'RUNS',
      'RSS',
      'ORPHANS',
    ] as const,
    cellPadding: 2,
  },
  sinceWindows: {
    order: ['1h', '6h', '1d', 'beginning'] as const,
    widest: 'beginning',
    display: {
      '1h': '1hr',
      '6h': '6hr',
      '1d': '1day',
      beginning: 'beginning',
    },
  },
} as const;
