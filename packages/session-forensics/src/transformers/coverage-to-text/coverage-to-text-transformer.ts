/**
 * PURPOSE: The one place that turns coverage rows into the text a CLI prints. Every table it
 * renders ends with the caveat block, and printing that caveat is the point of the file.
 *
 * `questToCoverageTransformer` settles the counts, one row per (flow, track) pair. A flow is one
 * graph of work inside a quest; a track is one reviewing role — codeweaver, flowrider or
 * siegemaster. Those counts are only ever an upper bound. The guard behind them cannot apply the
 * flow-slice or package-slice exclusions without an operation item, and a whole-quest reading never
 * has one to hand it. A reader who copies a number off this screen without the caveat is copying a
 * number already measured to disagree with `get-quest-work`.
 *
 * USAGE:
 * coverageToTextTransformer({ coverage: [TrackCoverageStub()] });
 * // Returns ContentText: one block per flow (flow id, column header, one row per track),
 * // separated by blank lines, ending in the caveat block
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { TrackCoverage } from '../../contracts/track-coverage/track-coverage-contract';

const TRACK_WIDTH = 22;
const OWED_WIDTH = 8;
const MARKED_WIDTH = 7;
const MET_WIDTH = 10;
const CANT_MEET_WIDTH = 14;
const UNMET_WIDTH = 8;
const UNMARKED_WIDTH = 11;

const HEADER_LINE = `  ${'sign-off track'.padEnd(TRACK_WIDTH)} ${'REQUIRED'.padStart(
  OWED_WIDTH,
)} ${'marked'.padStart(MARKED_WIDTH)} ${'met'.padStart(MET_WIDTH)} ${"can't meet".padStart(
  CANT_MEET_WIDTH,
)} ${'unmet'.padStart(UNMET_WIDTH)} ${'unmarked'.padStart(UNMARKED_WIDTH)}`;

const CAVEAT_BLOCK = [
  'These counts can be too high.',
  'This reading has no operation item, so it counts rows a real checklist would leave out.',
  'For the exact numbers, ask get-quest-work({questId, operationItemId}).',
].join('\n');

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
        ).padStart(MARKED_WIDTH)} ${String(row.met).padStart(MET_WIDTH)} ${String(
          row.cantMeet,
        ).padStart(CANT_MEET_WIDTH)} ${String(row.unmet).padStart(UNMET_WIDTH)} ${String(
          row.unsigned,
        ).padStart(UNMARKED_WIDTH)}`,
    );

    return [`Flow ${flowId}`, HEADER_LINE, ...rowLines].join('\n');
  });

  return contentTextContract.parse(`${flowBlocks.join('\n\n')}\n\n${CAVEAT_BLOCK}`);
};
