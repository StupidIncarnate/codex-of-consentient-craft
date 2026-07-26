/**
 * PURPOSE: Picks which staged call description answers a real call, favoring the most specific match
 *
 * USAGE:
 * const best = mockStagedBestMatchTransformer({ staged, actual: ['/a/quest.json'] });
 * // Returns the StagedCall that should answer this call, or undefined when nothing matches
 *
 * Higher mockArgsMatchTransformer score wins. At equal specificity a live one-shot outranks a
 * sticky staging — otherwise the later-written staging wins, so a test overrides a proxy default
 * written earlier. A consumed one-shot is skipped entirely.
 */

import type { StagedCall } from '../../contracts/staged-call/staged-call-contract';
import { mockArgsMatchTransformer } from '../mock-args-match/mock-args-match-transformer';

export const mockStagedBestMatchTransformer = ({
  staged,
  actual,
}: {
  staged: StagedCall[];
  actual: readonly unknown[];
}): StagedCall | undefined =>
  staged.reduce<StagedCall | undefined>((winner, candidate) => {
    const score =
      candidate.once && candidate.consumed
        ? null
        : mockArgsMatchTransformer({ staged: candidate.args, actual });

    if (score === null) {
      return winner;
    }

    if (winner === undefined) {
      return candidate;
    }

    const winnerScore = mockArgsMatchTransformer({ staged: winner.args, actual }) ?? -1;

    return score > winnerScore || (score === winnerScore && !winner.once) ? candidate : winner;
  }, undefined);
