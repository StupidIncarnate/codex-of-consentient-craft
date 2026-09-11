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
 *
 * Each candidate is scored ONCE and the score is carried alongside it. Scoring is a pure function
 * of a candidate's own args and this same call, so re-deriving the leader's score per candidate can
 * only return what the first pass did — and it is not free: `mockArgsMatchTransformer` ends in a
 * zod parse, measured at 1.15us inside jest, which one orchestration-resume test alone reaches
 * about ten thousand times.
 */

import type { StagedCall } from '../../contracts/staged-call/staged-call-contract';
import { mockArgsMatchTransformer } from '../mock-args-match/mock-args-match-transformer';

export const mockStagedBestMatchTransformer = ({
  staged,
  actual,
}: {
  staged: StagedCall[];
  actual: readonly unknown[];
}): StagedCall | undefined => {
  const scored = staged.flatMap((candidate) => {
    const score =
      candidate.once && candidate.consumed
        ? null
        : mockArgsMatchTransformer({ staged: candidate.args, actual });

    return score === null ? [] : [{ candidate, score }];
  });

  if (scored.length === 0) {
    return undefined;
  }

  return scored.reduce((winner, entry) =>
    entry.score > winner.score || (entry.score === winner.score && !winner.candidate.once)
      ? entry
      : winner,
  ).candidate;
};
