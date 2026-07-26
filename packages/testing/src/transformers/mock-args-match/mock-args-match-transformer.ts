/**
 * PURPOSE: Matches a staged argument list against the arguments a mocked function was actually called with
 *
 * USAGE:
 * const score = mockArgsMatchTransformer({ staged: ['/a/quest.json'], actual: ['/a/quest.json', 'utf-8'] });
 * // Returns MatchSpecificity 1 — staging fewer arguments than the call passes is a prefix match
 *
 * Staging a prefix leaves the remaining arguments unconstrained, so a proxy that only cares about
 * the path ignores the encoding. Returns null when the call does not match.
 */

import { matchSpecificityContract } from '../../contracts/match-specificity/match-specificity-contract';
import type { MatchSpecificity } from '../../contracts/match-specificity/match-specificity-contract';
import { mockArgValueMatchTransformer } from '../mock-arg-value-match/mock-arg-value-match-transformer';

export const mockArgsMatchTransformer = ({
  staged,
  actual,
}: {
  staged: readonly unknown[];
  actual: readonly unknown[];
}): MatchSpecificity | null => {
  if (staged.length > actual.length) {
    return null;
  }

  let total = 0;

  for (const [index, stagedArg] of staged.entries()) {
    const score = mockArgValueMatchTransformer({ staged: stagedArg, actual: actual[index] });

    if (score === null) {
      return null;
    }

    total += score;
  }

  return matchSpecificityContract.parse(total);
};
