/**
 * PURPOSE: Answers whether a filter's match COUNT satisfies what `expect` demands. Reach for this
 * over comparing `expect` and a count inline at every call site — `'some'` is the default and a
 * zero match fails it; `'one'` fails on more than one row too; `'any'` is the one value a zero
 * match satisfies, reusing the tool's own no-pick rule one layer down.
 *
 * USAGE:
 * isFilterExpectSatisfiedGuard({ expect: 'some', count: 1 });
 * // Returns true
 */
import type { FilterExpect } from '../../contracts/filter-expect/filter-expect-contract';

export const isFilterExpectSatisfiedGuard = ({
  expect: filterExpect,
  count,
}: {
  expect?: FilterExpect;
  count?: number;
}): boolean => {
  if (count === undefined) {
    return false;
  }
  if (filterExpect === 'any') {
    return true;
  }
  if (filterExpect === 'one') {
    return count === 1;
  }
  return count > 0;
};
