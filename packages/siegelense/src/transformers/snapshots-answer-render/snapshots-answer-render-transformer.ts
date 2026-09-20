/**
 * PURPOSE: Renders a `SnapshotsAnswer` into a concise, token-efficient human view for the
 * `dungeonmaster siegelense snapshots` CLI surface — instance id and state, followed by either
 * 'SNAPSHOTS: none recorded yet' or an aligned Unicode box-drawing table with columns
 * ['NAME', 'AGE', 'MANUAL']. Pure, so the table and header are provable without stdout.
 *
 * USAGE:
 * snapshotsAnswerRenderTransformer({ answer: SnapshotsAnswerStub({ snapshots: [] }) });
 * // Returns 'INSTANCE: inst_7f3a9c21 (alive)\nSNAPSHOTS: none recorded yet\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { SnapshotsAnswer } from '../../contracts/snapshots-answer/snapshots-answer-contract';
import { snapshotsTableStatics } from '../../statics/snapshots-table/snapshots-table-statics';
import { elapsedRenderTransformer } from '../elapsed-render/elapsed-render-transformer';

export const snapshotsAnswerRenderTransformer = ({
  answer,
  nowMs,
}: {
  answer: SnapshotsAnswer;
  nowMs?: EpochMs | undefined;
}): ContentText => {
  const instanceLine = `INSTANCE: ${answer.instanceId} (${answer.instanceState})`;

  if (answer.snapshots.length === 0) {
    return contentTextContract.parse(`${instanceLine}\nSNAPSHOTS: none recorded yet\n`);
  }

  const { headers, cellPadding } = snapshotsTableStatics.table;

  const rows = answer.snapshots.map((snapshot) => {
    const age =
      snapshot.age ??
      (nowMs === undefined
        ? '-'
        : elapsedRenderTransformer({
            elapsedMs: epochMsContract.parse(Math.max(0, nowMs - snapshot.atMs)),
          }));
    const manual = snapshot.manual ? 'true' : 'false';
    return [snapshot.name, age, manual];
  });

  const widths = headers.map((header, columnIndex) =>
    Math.max(header.length, ...rows.map((row) => row[columnIndex]?.length ?? 0)),
  );

  const topLine = `┌${widths.map((w) => '─'.repeat(w + cellPadding)).join('┬')}┐`;
  const headerLine = `│${headers.map((h, i) => ` ${h.padEnd(widths[i] ?? h.length)} `).join('│')}│`;
  const headerSeparator = `├${widths.map((w) => '─'.repeat(w + cellPadding)).join('┼')}┤`;
  const rowLines = rows.map(
    (cells) => `│${cells.map((c, i) => ` ${c.padEnd(widths[i] ?? c.length)} `).join('│')}│`,
  );
  const bottomLine = `└${widths.map((w) => '─'.repeat(w + cellPadding)).join('┴')}┘`;

  const tableLines = [topLine, headerLine, headerSeparator, ...rowLines, bottomLine];

  return contentTextContract.parse(`${instanceLine}\n${tableLines.join('\n')}\n`);
};
