/**
 * PURPOSE: Defines immutable column headers and formatting constants for the status fleet table.
 *
 * USAGE:
 * statusTableStatics.table.headers;
 * // Returns ['ID', 'STATE', 'SPEC', 'BRANCH', 'UPTIME', 'LAST BEAT', 'RUNS', 'RSS', 'ORPHANS']
 *
 * statusTableStatics.table.cellPadding;
 * // Returns 2
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
} as const;
