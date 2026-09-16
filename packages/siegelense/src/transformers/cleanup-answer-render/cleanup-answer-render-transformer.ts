/**
 * PURPOSE: Renders a `CleanupAnswer` into the text an operator reads at a terminal — what was
 * reaped, what ports and locks came back, and what was left alone and why. `LEFT ALONE` is printed
 * even when empty: a cleanup that only ever shows what it removed cannot be told from one that
 * removed the wrong thing (siegelense-tooling.md line 1365). Pure, so this text is provable without
 * stdout, the same split `registryEntryRowFormatTransformer` already uses for the fleet listing.
 *
 * USAGE:
 * cleanupAnswerRenderTransformer({ answer: CleanupAnswerStub() });
 * // Returns 'REAPED: inst_9b2c (stale 9h, killed 33812, 33840, home removed)\n...'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { CleanupAnswer } from '../../contracts/cleanup-answer/cleanup-answer-contract';

export const cleanupAnswerRenderTransformer = ({
  answer,
}: {
  answer: CleanupAnswer;
}): ContentText => {
  const reapedText =
    answer.reaped.length === 0
      ? 'none'
      : answer.reaped
          .map(
            (entry) =>
              `${entry.id} (stale ${entry.staleFor}, killed ${
                entry.killed.length === 0 ? 'none' : entry.killed.join(', ')
              }, home ${entry.homeRemoved ? 'removed' : 'kept'})`,
          )
          .join(', ');

  const portsText = answer.portsReleased.length === 0 ? 'none' : answer.portsReleased.join(', ');

  const leftAloneText =
    answer.leftAlone.length === 0
      ? 'none'
      : answer.leftAlone.map((entry) => `${entry.id} (${entry.why})`).join(', ');

  return contentTextContract.parse(
    `REAPED: ${reapedText}\nPORTS RELEASED: ${portsText}\nLOCK RELEASED: ${
      answer.lockReleased ? 'yes' : 'no'
    }\nLEFT ALONE: ${leftAloneText}\n`,
  );
};
