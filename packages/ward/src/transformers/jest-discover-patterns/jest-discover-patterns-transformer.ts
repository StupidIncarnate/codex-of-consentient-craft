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
      excludePatterns: exts.flatMap((ext) => [
        globPatternContract.parse(`**/*.integration.test.${ext}`),
        globPatternContract.parse(`**/*.e2e.test.${ext}`),
      ]),
    };
  }

  return {
    patterns: exts.flatMap((ext) => [
      globPatternContract.parse(`src/**/*.integration.test.${ext}`),
      globPatternContract.parse(`test/**/*.integration.test.${ext}`),
    ]),
    excludePatterns: [],
  };
};
