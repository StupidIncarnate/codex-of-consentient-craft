/**
 * PURPOSE: Renders a `SnapshotsAnswer` into a concise, token-efficient human view for the
 * `dungeonmaster siegelense snapshots` CLI surface — instance id and state, followed by either an
 * empty-list notice or an aligned Unicode box-drawing table with columns ['NAME', 'AGE', 'MANUAL'].
 * The empty-list notice is state-aware: a `killed` instance's snapshot store died with the
 * throwaway home at kill (`snapshotsAnswerContract`'s own header — "the throwaway home is gone and
 * took its restore points with it"), which is a different fact than "nothing recorded yet", so it
 * gets a different sentence rather than the same empty array reading two ways. Pure, so the table
 * and header are provable without stdout.
 *
 * USAGE:
 * snapshotsAnswerRenderTransformer({ answer: SnapshotsAnswerStub({ snapshots: [] }) });
 * // Returns 'INSTANCE: inst_7f3a9c21 (alive)\nSNAPSHOTS: none recorded yet\n'
 */


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
}): string => {
  const instanceLine = `INSTANCE: ${answer.instanceId} (${answer.instanceState})`;

  if (answer.snapshots.length === 0) {
    return (answer.instanceState === 'killed'
        ? `${instanceLine}\nSNAPSHOTS: none — the throwaway home died with the instance at kill\n`
        : `${instanceLine}\nSNAPSHOTS: none recorded yet\n`);
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

  return `${instanceLine}\n${tableLines.join('\n')}\n`;
};
