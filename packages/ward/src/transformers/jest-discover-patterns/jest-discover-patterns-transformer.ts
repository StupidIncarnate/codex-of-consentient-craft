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
      patterns: [globPatternContract.parse('src/**/*.test.ts')],
      excludePatterns: [
        globPatternContract.parse('**/*.integration.test.ts'),
        globPatternContract.parse('**/*.e2e.test.ts'),
      ],
    };
  }

  return {
    patterns: [globPatternContract.parse('src/**/*.integration.test.ts')],
    excludePatterns: [],
  };
};
