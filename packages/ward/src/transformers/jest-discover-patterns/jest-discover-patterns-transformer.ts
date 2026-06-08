/**
 * PURPOSE: Generates Jest file discovery patterns based on package jest config and check type
 *
 * USAGE:
 * const { patterns, excludePatterns } = jestDiscoverPatternsTransformer({ checkType: 'unit', hasPackageJestConfig: true });
 * // Returns: { patterns: ['src/**\/*.test.ts'], excludePatterns: ['**\/*.integration.test.ts', '**\/*.e2e.test.ts'] }
 */

import {
  globPatternContract,
  type GlobPattern,
} from '../../contracts/glob-pattern/glob-pattern-contract';
import { checkCommandsStatics } from '../../statics/check-commands/check-commands-statics';
import { tsExtensionsStatics } from '../../statics/ts-extensions/ts-extensions-statics';

const exts = tsExtensionsStatics.allExtensions;

export const jestDiscoverPatternsTransformer = ({
  checkType,
  hasPackageJestConfig,
}: {
  checkType: 'unit' | 'integration';
  hasPackageJestConfig: boolean;
}): { patterns: GlobPattern[]; excludePatterns: GlobPattern[] } => {
  const statics = checkCommandsStatics[checkType];
  const fallbackPatterns = statics.discoverPatterns.map((p) => globPatternContract.parse(p));
  const fallbackExclude =
    'excludePatterns' in statics
      ? statics.excludePatterns.map((p: string) => globPatternContract.parse(p))
      : [];

  if (!hasPackageJestConfig) {
    return { patterns: fallbackPatterns, excludePatterns: fallbackExclude };
  }

  if (checkType === 'unit') {
    return {
      patterns: exts.flatMap((ext) => [
        globPatternContract.parse(`src/**/*.test.${ext}`),
        globPatternContract.parse(`test/**/*.test.${ext}`),
      ]),
      // `bin/**` and `tests/**` integration/e2e excludes mirror the integration-branch
      // discovery roots so a `bin/` integration test or a `tests/integration/` test is
      // never collected as a unit test. `.e2e.test` is retained defensively — e2e is
      // Playwright-only (`*.e2e.ts`), so no repo file carries the Jest suffix, but a stray
      // one must still stay out of the unit run.
      excludePatterns: exts.flatMap((ext) => [
        globPatternContract.parse(`**/*.integration.test.${ext}`),
        globPatternContract.parse(`**/*.e2e.test.${ext}`),
        globPatternContract.parse(`bin/**/*.integration.test.${ext}`),
        globPatternContract.parse(`bin/**/*.e2e.test.${ext}`),
        globPatternContract.parse(`tests/**/*.integration.test.${ext}`),
        globPatternContract.parse(`tests/**/*.e2e.test.${ext}`),
      ]),
    };
  }

  return {
    patterns: exts.flatMap((ext) => [
      globPatternContract.parse(`src/**/*.integration.test.${ext}`),
      globPatternContract.parse(`test/**/*.integration.test.${ext}`),
      globPatternContract.parse(`bin/**/*.integration.test.${ext}`),
      globPatternContract.parse(`tests/**/*.integration.test.${ext}`),
    ]),
    excludePatterns: [],
  };
};
