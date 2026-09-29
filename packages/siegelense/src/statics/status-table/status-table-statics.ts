/**
 * PURPOSE: Defines immutable column headers and formatting constants for the status fleet table,
 * plus the `--since` window vocabulary `statusAnswerRenderTransformer`'s empty-fleet sentence reads
 * to name the active filter and suggest the widest one. `widest` names which member of `order` that
 * suggestion jumps to — always the top of the range, never the next incremental step, matching how a
 * caller actually escapes an empty fleet (widen all the way, not by 4x at a time) — so landing a new
 * top window here is the one edit that sentence needs.
 *
 * `singleInstanceTable` draws the single-`--instance` view in the SAME box-drawing style as the
 * fleet table, just transposed: one row per field (INSTANCE, SPEC, UPTIME, …) rather than one row
 * per instance, since a single record's fields don't share one column's width the way a fleet's
 * same-typed rows do.
 *
 * The `MEMORY` header (fleet) and `MEMORY` field (single-instance) name the same reading a `RSS`
 * label used to — the last measured memory of the instance's processes, or a killed instance's
 * footprint when it ended — under a plain word an agent or a person skimming does not need to know
 * "RSS" to read.
 *
 * USAGE:
 * statusTableStatics.table.headers;
 * // Returns ['ID', 'STATE', 'SPEC', 'BRANCH', 'UPTIME', 'LAST BEAT', 'RUNS', 'MEMORY', 'ORPHANS']
 *
 * statusTableStatics.table.cellPadding;
 * // Returns 2
 *
 * statusTableStatics.sinceWindows.display['6h'];
 * // Returns '6hr'
 *
 * statusTableStatics.singleInstanceTable.headers;
 * // Returns ['FIELD', 'VALUE']
 *
 * statusTableStatics.evidenceTree.indent;
 * // Returns '  ' — one nesting level of the EVIDENCE DIR file tree
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
      'MEMORY',
      'ORPHANS',
    ] as const,
    cellPadding: 2,
  },
  singleInstanceTable: {
    headers: ['FIELD', 'VALUE'] as const,
    cellPadding: 2,
  },
  evidenceTree: {
    indent: '  ',
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
