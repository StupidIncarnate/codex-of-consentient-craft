/**
 * PURPOSE: `questToCoverageTransformer` settles per (flow, track) counts, but those counts are only
 * ever an upper bound — the guard behind them cannot apply the flow-slice or package-slice exclusions
 * without an operation item, and a whole-quest reading never has one to hand it. This is the one place
 * that turns those rows into CLI text, and it refuses to print a single number without the caveat
 * that follows it: every table this renders ends with the NOT AUTHORITATIVE line, because a reader
 * who copies a number off this screen without that line is copying a number that has already been
 * measured to disagree with `get-qa-checklist`.
 *
 * USAGE:
 * coverageToTextTransformer({ coverage: [TrackCoverageStub()] });
 * // Returns ContentText: one block per flow (flow id, column header, one row per track), blank line
 * // separated, ending in the NOT AUTHORITATIVE line
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { TrackCoverage } from '../../contracts/track-coverage/track-coverage-contract';

const TRACK_WIDTH = 22;
const OWED_WIDTH = 6;
const SIGNED_WIDTH = 7;
const CONFIRMED_WIDTH = 10;
const UNCONFIRMABLE_WIDTH = 14;
const UNSIGNED_WIDTH = 9;

const HEADER_LINE = `  ${'track'.padEnd(TRACK_WIDTH)} ${'OWED'.padStart(OWED_WIDTH)} ${'signed'.padStart(
  SIGNED_WIDTH,
)} ${'confirmed'.padStart(CONFIRMED_WIDTH)} ${'unconfirmable'.padStart(
  UNCONFIRMABLE_WIDTH,
)} ${'UNSIGNED'.padStart(UNSIGNED_WIDTH)}`;

const NOT_AUTHORITATIVE_LINE =
  'NOT AUTHORITATIVE — get-qa-checklist({questId, operationItemId}) is the real denominator.';

export const coverageToTextTransformer = ({
  coverage,
}: {
  coverage: readonly TrackCoverage[];
}): ContentText => {
  if (coverage.length === 0) {
    return contentTextContract.parse('');
  }

  const byFlow = new Map<TrackCoverage['flowId'], TrackCoverage[]>();
  for (const row of coverage) {
    const existing = byFlow.get(row.flowId);
    if (existing === undefined) {
      byFlow.set(row.flowId, [row]);
    } else {
      existing.push(row);
    }
  }

  const flowBlocks = [...byFlow.entries()].map(([flowId, rows]) => {
    const rowLines = rows.map(
      (row) =>
        `  ${row.track.padEnd(TRACK_WIDTH)} ${String(row.owed).padStart(OWED_WIDTH)} ${String(
          row.signed,
        ).padStart(SIGNED_WIDTH)} ${String(row.confirmed).padStart(CONFIRMED_WIDTH)} ${String(
          row.unconfirmable,
        ).padStart(UNCONFIRMABLE_WIDTH)} ${String(row.unsigned).padStart(UNSIGNED_WIDTH)}`,
    );

    return [flowId, HEADER_LINE, ...rowLines].join('\n');
  });

  return contentTextContract.parse(`${flowBlocks.join('\n\n')}\n\n${NOT_AUTHORITATIVE_LINE}`);
};
