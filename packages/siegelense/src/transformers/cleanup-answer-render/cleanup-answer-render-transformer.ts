/**
 * PURPOSE: Renders a `CleanupAnswer` into the text an operator reads at a terminal — what was
 * reaped, what ports and locks came back, how much evidence aged out, and what was left alone and
 * why. `LEFT ALONE` is printed even when empty: a cleanup that only ever shows what it removed
 * cannot be told from one that removed the wrong thing (siegelense-tooling.md line 1412). `ASSETS
 * AGED` prints its zero for the same reason — a call that ages nothing and a call that says nothing
 * about ageing read identically otherwise. Pure, so this text is provable without stdout.
 *
 * USAGE:
 * cleanupAnswerRenderTransformer({ answer: CleanupAnswerStub() });
 * // Returns 'REAPED: inst_9b2c (stale 9h, killed 33812, 33840, home removed)\n...'
 */


import type { CleanupAnswer } from '../../contracts/cleanup-answer/cleanup-answer-contract';

export const cleanupAnswerRenderTransformer = ({
  answer,
}: {
  answer: CleanupAnswer;
}): string => {
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

  return `REAPED: ${reapedText}\nPORTS RELEASED: ${portsText}\nLOCK RELEASED: ${
      // `false` here only ever means no stale lock needed releasing — an unlink failure inside
      // lockReleaseLayerBroker throws rather than returning false, so "none held" never hides a
      // failed release; that failure surfaces as a thrown error instead of a CleanupAnswer at all.
      answer.lockReleased ? 'yes' : 'none held'
    }\nASSETS AGED: ${answer.assetsAged.instances} instances, ${
      answer.assetsAged.freedMB
    }MB\nLEFT ALONE: ${leftAloneText}\n`;
};
