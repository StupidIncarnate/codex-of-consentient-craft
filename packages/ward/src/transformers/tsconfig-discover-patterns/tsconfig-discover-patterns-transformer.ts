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

  if (typeof tsconfigData !== 'object' || tsconfigData === null) {
    return fallback;
  }

  const includeRaw: unknown =
    'include' in tsconfigData ? Reflect.get(tsconfigData, 'include') : undefined;

  if (!Array.isArray(includeRaw)) {
    return fallback;
  }

  const patterns: GlobPattern[] = [];

  for (const entry of includeRaw) {
    if (typeof entry === 'string') {
      const expanded = expandToTsGlobsTransformer({ pattern: globPatternContract.parse(entry) });
      patterns.push(...expanded);
    }
  }

  if (patterns.length === 0) {
    return fallback;
  }

  const excludeRaw: unknown =
    'exclude' in tsconfigData ? Reflect.get(tsconfigData, 'exclude') : undefined;

  const exclude: GlobPattern[] = [...DEFAULT_EXCLUDE];
  if (Array.isArray(excludeRaw)) {
    for (const entry of excludeRaw) {
      if (typeof entry === 'string') {
        const parsed = globPatternContract.parse(entry);
        if (!exclude.includes(parsed)) {
          exclude.push(parsed);
        }
      }
    }
  }

  return { patterns, exclude };
};
