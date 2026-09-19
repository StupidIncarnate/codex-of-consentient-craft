/**
 * PURPOSE: Renders a `PruneAnswer` into the text an operator reads at a terminal — what was freed,
 * what was taken, what was refused and with which citing file, and which citation KINDS went
 * unchecked. `REFUSED` and `NOT CHECKED` are printed even when empty, for the same reason
 * `cleanupAnswerRenderTransformer` always prints `LEFT ALONE`: a deletion report that shows only
 * what it removed cannot be told from one that removed the wrong thing (siegelense-tooling.md line
 * 1412), and `NOT CHECKED` is the line that stops an empty `REFUSED` reading as "nothing cites any
 * of this". Pure, so the text is provable without stdout. Reach for this over
 * `cleanupAnswerRenderTransformer`: that one renders a reap of INSTANCES, this one a reclaim of
 * FILES, and the two answers share no field.
 *
 * USAGE:
 * pruneAnswerRenderTransformer({ answer: PruneAnswerStub() });
 * // Returns 'FREED: 4100MB (4299161600 bytes)\nREMOVED: …\nREFUSED: …\nNOT CHECKED: …\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { PruneAnswer } from '../../contracts/prune-answer/prune-answer-contract';

const EVERYTHING = 'everything';
const NONE = 'none';

export const pruneAnswerRenderTransformer = ({ answer }: { answer: PruneAnswer }): ContentText => {
  const removedText =
    answer.removed.length === 0
      ? NONE
      : answer.removed
          .map(
            (entry) =>
              `${entry.id} (${entry.kind ?? EVERYTHING}, ${entry.freedMB}MB, ${
                entry.freedBytes
              } bytes, ${entry.tombstoned ? 'tombstoned' : 'row kept'})`,
          )
          .join(', ');

  const refusedText =
    answer.refused.length === 0
      ? NONE
      : answer.refused.map((entry) => `${entry.id} (${entry.why})`).join(', ');

  const unresolvedText =
    answer.unresolved.length === 0
      ? NONE
      : answer.unresolved.map((gap) => `${gap.kind} (${gap.why})`).join(', ');

  return contentTextContract.parse(
    `FREED: ${answer.freedMB}MB (${answer.freedBytes} bytes)\n` +
      `REMOVED: ${removedText}\n` +
      `REFUSED: ${refusedText}\n` +
      `NOT CHECKED: ${unresolvedText}\n`,
  );
};
