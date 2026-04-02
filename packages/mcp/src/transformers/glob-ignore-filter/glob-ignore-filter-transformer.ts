/**
 * PURPOSE: Filters glob ignore patterns based on the user's glob target, removing rules that block explicitly targeted directories
 *
 * USAGE:
 * globIgnoreFilterTransformer({ pattern: GlobPatternStub({ value: 'node_modules/zod/src' }) });
 * // Returns ignore list without the node_modules rule when pattern targets node_modules
 */
import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';
import { globPatternContract } from '../../contracts/glob-pattern/glob-pattern-contract';
import type { GlobPattern } from '../../contracts/glob-pattern/glob-pattern-contract';

const DIR_NAME_PATTERN = /^\*\*\//u;
const TRAILING_GLOB_PATTERN = /\/\*\*$/u;

export const globIgnoreFilterTransformer = ({
  pattern,
}: {
  pattern: GlobPattern;
}): readonly GlobPattern[] =>
  fileDiscoveryStatics.globIgnorePatterns
    .filter((rule) => {
      const dirName = rule.replace(DIR_NAME_PATTERN, '').replace(TRAILING_GLOB_PATTERN, '');
      return !String(pattern).includes(`${dirName}/`);
    })
    .map((rule) => globPatternContract.parse(rule));
