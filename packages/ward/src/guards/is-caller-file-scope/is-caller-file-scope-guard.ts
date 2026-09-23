/**
 * PURPOSE: Answers "did the caller type a list of FILES" over the filters a saved `WardResult`
 * carries — the question both report surfaces key their narrowing on. Reach for this rather than
 * `isExplicitPathScopeGuard` wherever you hold a `RunFilters` instead of a `WardConfig`: that guard
 * answers who named the paths, this one adds that every path names one file.
 *
 * USAGE:
 * isCallerFileScopeGuard({ filters: RunFiltersStub({ passthrough: ['packages/ward/src/a.test.ts'] }) });
 * // Returns: true
 * isCallerFileScopeGuard({ filters: RunFiltersStub({ passthrough: ['packages/ward'] }) });
 * // Returns: false — a directory scope asked for the package, not for those files
 * isCallerFileScopeGuard({ filters: RunFiltersStub({ uncommitted: true, passthrough: ['src/a.ts'] }) });
 * // Returns: false — git wrote that list, and a diff is unbounded
 *
 * WHAT IT BUYS, in both places: a run this returns true for named a handful of files, so its report
 * can afford each failure's whole message, and its `not run` list has nothing honest left to say —
 * `pathCheckLayerBroker` already halts a scope naming a path disk does not have, so a misspelled
 * `.tsx` never reaches a report at all.
 *
 * A DIRECTORY SCOPE AND AN UNSCOPED RUN BOTH ANSWER FALSE, deliberately. There a file the package
 * discovered and did not run is the finding, and the failure count is bounded by nothing.
 */

import type { RunFilters } from '../../contracts/run-filters/run-filters-contract';
import { isFilePathGuard } from '../is-file-path/is-file-path-guard';

export const isCallerFileScopeGuard = ({ filters }: { filters?: RunFilters }): boolean => {
  if (filters === undefined) {
    return false;
  }

  if (filters.committed === true || filters.uncommitted === true) {
    return false;
  }

  const passthrough = filters.passthrough ?? [];

  if (passthrough.length === 0) {
    return false;
  }

  return passthrough.every((arg) => isFilePathGuard({ path: String(arg) }));
};
