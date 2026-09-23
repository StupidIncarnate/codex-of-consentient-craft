/**
 * PURPOSE: The `quest` CLI command needs the per-work-item index
 * `.claude/commands/quest-forensics.md` Step 1 built by hand — printed as plain text, in the same
 * label-block style `summaryToTextTransformer` uses, rather than a fixed-width table. A table
 * cannot hold `operationText`, which runs to a full sentence.
 *
 * USAGE:
 * questIndexToTextTransformer({ userRequest: 'Add auth', rows: [WorkItemIndexRowStub()] });
 * // Returns ContentText: "User request: Add auth", then one label block per row
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { WorkItemIndexRow } from '../../contracts/work-item-index-row/work-item-index-row-contract';

const LABEL_WIDTH = 24;
const SECONDS_PER_MINUTE = 60;
const NONE = '(none)';

export const questIndexToTextTransformer = ({
  userRequest,
  rows,
}: {
  userRequest?: string;
  rows: readonly WorkItemIndexRow[];
}): ContentText => {
  if (rows.length === 0 && userRequest === undefined) {
    return contentTextContract.parse('');
  }

  const userRequestLine = `User request: ${userRequest ?? NONE}`;

  const rowBlocks = rows.map((row, index) => {
    const wallClockLine =
      row.wallClockSeconds === undefined
        ? `  ${'Wall clock'.padEnd(LABEL_WIDTH)}(not completed)`
        : `  ${'Wall clock'.padEnd(LABEL_WIDTH)}${(row.wallClockSeconds / SECONDS_PER_MINUTE).toFixed(1)} minutes`;

    return [
      `Work item ${index + 1} — ${row.role} (${row.status})`,
      `  ${'Work item id'.padEnd(LABEL_WIDTH)}${row.workItemId}`,
      `  ${'Session id'.padEnd(LABEL_WIDTH)}${row.sessionId ?? NONE}`,
      wallClockLine,
      `  ${'Operation'.padEnd(LABEL_WIDTH)}${row.operationText ?? NONE}`,
      `  ${'Flows'.padEnd(LABEL_WIDTH)}${row.flowIds.length === 0 ? NONE : row.flowIds.join(', ')}`,
      `  ${'Packages'.padEnd(LABEL_WIDTH)}${row.packageNames.length === 0 ? NONE : row.packageNames.join(', ')}`,
      `  ${'Transcript size'.padEnd(LABEL_WIDTH)}${row.transcriptSizeBytes.toLocaleString('en-US')} bytes`,
      `  ${'Sub-agents'.padEnd(LABEL_WIDTH)}${row.subagentCount.toLocaleString('en-US')}`,
      `  ${'Ward/riftcarver'.padEnd(LABEL_WIDTH)}${row.wardRiftcarverSummary ?? NONE}`,
    ].join('\n');
  });

  return contentTextContract.parse([userRequestLine, ...rowBlocks].join('\n\n'));
};
