/**
 * PURPOSE: Drops the ignore rules a caller's own glob explicitly targets, so naming an ignored
 * directory is how an agent searches inside one. This escape hatch is what makes ignoring tmp/ and
 * worktrees/ a narrowing of unscoped sweeps rather than a wall.
 *
 * Matching is on whole path SEGMENTS of the CALLER'S glob, never a substring of the cwd-joined
 * absolute pattern. Both halves are load-bearing: a project checked out under /tmp or ~/build would
 * otherwise disable that rule for every search it ever ran, and a glob for `coverage-report` would
 * disable the `coverage` rule.
 *
 * USAGE:
 * globIgnoreFilterTransformer({ patterns, glob: GlobPatternStub({ value: 'tmp\/**' }) });
 * // Returns patterns without the tmp rule
 */

import { globPatternContract } from '@dungeonmaster/shared/contracts';
import type { GlobPattern } from '@dungeonmaster/shared/contracts';

const PATH_SEPARATOR = '/';
const WILDCARD_PATTERN = /[*?[\]]/u;

export const globIgnoreFilterTransformer = ({
  patterns,
  glob,
}: {
  patterns: readonly GlobPattern[];
  glob: GlobPattern;
}): readonly GlobPattern[] => {
  const globSegments = new Set(
    String(glob)
      .split(PATH_SEPARATOR)
      .filter((segment) => segment !== '' && !WILDCARD_PATTERN.test(segment)),
  );

  return patterns
    .filter((rule) => {
      const ruleSegments = String(rule)
        .split(PATH_SEPARATOR)
        .filter((segment) => segment !== '' && !WILDCARD_PATTERN.test(segment));

      // A rule built only from wildcards (`**\/*.log`) names no directory, so there is nothing a
      // caller could target to opt out of it.
      if (ruleSegments.length === 0) {
        return true;
      }

      // EVERY literal segment must be targeted, not merely one: a glob for `tests` should not
      // reopen a `tests/tmp` rule it never mentioned.
      return !ruleSegments.every((segment) => globSegments.has(segment));
    })
    .map((rule) => globPatternContract.parse(rule));
};
