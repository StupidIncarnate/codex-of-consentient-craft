/**
 * PURPOSE: Matches one staged argument matcher against one actual argument, scoring how specific the match is
 *
 * USAGE:
 * const score = mockArgValueMatchTransformer({ staged: { nodir: true }, actual: { nodir: true, cwd: '/x' } });
 * // Returns MatchSpecificity 1 — objects match on the keys the matcher names, extra keys are ignored
 *
 * Objects match by subset so a test never has to spell out the full options bag the implementation
 * happens to pass. Arrays match element-wise at equal length. A function matcher is a predicate.
 * Returns null when the values do not match.
 */

import { matchSpecificityContract } from '../../contracts/match-specificity/match-specificity-contract';
import type { MatchSpecificity } from '../../contracts/match-specificity/match-specificity-contract';

export const mockArgValueMatchTransformer = ({
  staged,
  actual,
}: {
  staged: unknown;
  actual: unknown;
}): MatchSpecificity | null => {
  if (typeof staged === 'function') {
    const predicate = staged as (value: unknown) => unknown;

    return predicate(actual) === true ? matchSpecificityContract.parse(1) : null;
  }

  if (Array.isArray(staged)) {
    if (!Array.isArray(actual) || actual.length !== staged.length) {
      return null;
    }

    let total = 0;

    for (const [index, element] of staged.entries()) {
      const score = mockArgValueMatchTransformer({ staged: element, actual: actual[index] });

      if (score === null) {
        return null;
      }

      total += score;
    }

    return matchSpecificityContract.parse(total);
  }

  if (staged instanceof Date) {
    return actual instanceof Date && staged.getTime() === actual.getTime()
      ? matchSpecificityContract.parse(1)
      : null;
  }

  if (staged instanceof RegExp) {
    return typeof actual === 'string' && staged.test(actual)
      ? matchSpecificityContract.parse(1)
      : null;
  }

  if (typeof staged === 'object' && staged !== null) {
    if (typeof actual !== 'object' || actual === null) {
      return null;
    }

    const stagedRecord = staged as Record<PropertyKey, unknown>;
    const actualRecord = actual as Record<PropertyKey, unknown>;
    let total = 0;

    for (const key of Object.keys(stagedRecord)) {
      const score = mockArgValueMatchTransformer({
        staged: stagedRecord[key],
        actual: actualRecord[key],
      });

      if (score === null) {
        return null;
      }

      total += score;
    }

    return matchSpecificityContract.parse(total);
  }

  return Object.is(staged, actual) ? matchSpecificityContract.parse(1) : null;
};
