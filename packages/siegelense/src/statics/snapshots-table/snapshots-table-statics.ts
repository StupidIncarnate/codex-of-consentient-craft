/**
 * PURPOSE: Defines immutable column headers and formatting constants for the snapshots table.
 *
 * USAGE:
 * snapshotsTableStatics.table.headers;
 * // Returns ['NAME', 'AGE', 'MANUAL']
 *
 * snapshotsTableStatics.table.cellPadding;
 * // Returns 2
 */

export const snapshotsTableStatics = {
  table: {
    headers: ['NAME', 'AGE', 'MANUAL'] as const,
    cellPadding: 2,
  },
} as const;
