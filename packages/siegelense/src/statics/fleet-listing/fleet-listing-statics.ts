/**
 * PURPOSE: The literal text `dungeonmaster siegelense`'s bare-invocation table renders around —
 * the column header order and the gap between padded columns, the evidence-path shape printed once
 * beneath the table (every row's real evidence path shares that prefix and differs only by the id
 * already printed in column one, so the table itself carries no evidence column), and the footer
 * sentence explaining a `killed` row is a tombstone, not a leak. Reach for this over inventing prose
 * inline in the responder or its transformers, the same split `siegelenseHelpStatics` already uses
 * for `--help` text.
 *
 * USAGE:
 * fleetListingStatics.table.header;
 * // Returns ['ID', 'STATE', 'SPEC', 'PORTS', 'LAST BEAT']
 *
 * fleetListingStatics.evidence.shapeLine;
 * // Returns 'evidence: <repoRoot>/.siegelense/{unowned|guilds/<guildId>}/instances/<id>/\n'
 */

export const fleetListingStatics = {
  table: {
    header: ['ID', 'STATE', 'SPEC', 'PORTS', 'LAST BEAT'] as const,
    columnGap: 2,
    cellPadding: 2,
  },
  evidence: {
    shapeLine: 'evidence: <repoRoot>/.siegelense/{unowned|guilds/<guildId>}/instances/<id>/\n',
  },
  killedFooter: {
    tombstoneSingular: 'tombstone',
    tombstonePlural: 'tombstones',
    body:
      ', not leaks: no process, no port, no memory. The row and its evidence\n' +
      'are kept so `results` and `status` still answer for a dead instance, which is the normal\n' +
      'case for anyone reading a run that broke. No built call removes them; that is `prune`.\n',
  },
} as const;
