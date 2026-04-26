/**
 * PURPOSE: Converts tsconfig.json include/exclude arrays into TypeScript-specific glob patterns for file discovery
 *
 * USAGE:
 * const { patterns, exclude } = tsconfigDiscoverPatternsTransformer({ tsconfigData: { include: ['src'], exclude: ['dist'] } });
 * // Returns: { patterns: ['src/**\/*.ts', 'src/**\/*.tsx'], exclude: ['node_modules', 'dist'] }
 */

import {
  globPatternContract,
  type GlobPattern,
} from '../../contracts/glob-pattern/glob-pattern-contract';
import { tsconfigJsonContract } from '../../contracts/tsconfig-json/tsconfig-json-contract';
import { checkCommandsStatics } from '../../statics/check-commands/check-commands-statics';
import { expandToTsGlobsTransformer } from '../expand-to-ts-globs/expand-to-ts-globs-transformer';

const DEFAULT_EXCLUDE: GlobPattern[] = [
  globPatternContract.parse('node_modules'),
  globPatternContract.parse('dist'),
];

export const tsconfigDiscoverPatternsTransformer = ({
  tsconfigData,
}: {
  tsconfigData: unknown;
}): { patterns: GlobPattern[]; exclude: GlobPattern[] } => {
  const fallback = {
    patterns: checkCommandsStatics.typecheck.discoverPatterns.map((p) =>
      globPatternContract.parse(p),
    ),
    exclude: [...DEFAULT_EXCLUDE],
  };

  const tsconfig = ((): ReturnType<typeof tsconfigJsonContract.parse> | null => {
    try {
      return tsconfigJsonContract.parse(tsconfigData);
    } catch {
      return null;
    }
  })();

  if (tsconfig?.include === undefined) {
    return fallback;
  }

  const patterns: GlobPattern[] = [];

  for (const entry of tsconfig.include) {
    const expanded = expandToTsGlobsTransformer({
      pattern: globPatternContract.parse(String(entry)),
    });
    patterns.push(...expanded);
  }

  if (patterns.length === 0) {
    return fallback;
  }

  const exclude: GlobPattern[] = [...DEFAULT_EXCLUDE];
  if (tsconfig.exclude !== undefined) {
    for (const entry of tsconfig.exclude) {
      const parsed = globPatternContract.parse(String(entry));
      if (!exclude.includes(parsed)) {
        exclude.push(parsed);
      }
    }
  }

  return { patterns, exclude };
};
