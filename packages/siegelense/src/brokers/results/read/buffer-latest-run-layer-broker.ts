/**
 * PURPOSE: Names the latest run that holds lines in one per-instance buffer file, and how many it
 * holds, so a `results` read that matched nothing can say where that kind of evidence actually is.
 * Every buffer line is filed under the run and step it arrived in, so a run that loaded no page
 * holds no network lines while an earlier run holds them all — an empty answer that does not say
 * so reads exactly like a clean run, or like a run that was never recorded. Reach for this over
 * `bufferReadLayerBroker` when the question is WHICH run has lines, not what the lines say. Lines
 * filed between runs (`runId: null`) belong to no run and are skipped. A missing buffer file answers
 * `null`, the same "nothing recorded" `bufferReadLayerBroker` answers `[]` for.
 *
 * USAGE:
 * await bufferLatestRunLayerBroker({ bufferPath: AbsoluteFilePathStub({ value: '/repo/.../network.jsonl' }) });
 * // Returns { runId: 'run_5', rows: 7 } when run_5 is the last run with network lines
 */

import { readFileIfExists } from '#gateway/node/fs__promises';
import { bufferEntryContract } from '../../../contracts/buffer-entry/buffer-entry-contract';
import type { BufferEntry } from '../../../contracts/buffer-entry/buffer-entry-contract';
import type { SiegeRun } from '@dungeonmaster/shared/contracts';

export const bufferLatestRunLayerBroker = async ({
  bufferPath,
}: {
  bufferPath: string;
}): Promise<{ runId: SiegeRun['id']; rows: number } | null> => {
  const content = await readFileIfExists(bufferPath);

  if (content === null) {
    return null;
  }

  const entries = content
    .split('\n')
    .filter((line) => line.length > 0)
    .reduce<BufferEntry[]>((accumulated, line) => {
      try {
        accumulated.push(bufferEntryContract.parse(JSON.parse(line)));
      } catch {
        // A truncated final line from a mid-append crash — every earlier, complete entry still
        // counts.
      }
      return accumulated;
    }, []);

  const latestRunId = entries
    .map((entry) => entry.runId)
    .filter((runId) => runId !== null)
    .at(-1);

  if (latestRunId === undefined) {
    return null;
  }

  return {
    runId: latestRunId,
    rows: entries.filter((entry) => entry.runId === latestRunId).length,
  };
};
