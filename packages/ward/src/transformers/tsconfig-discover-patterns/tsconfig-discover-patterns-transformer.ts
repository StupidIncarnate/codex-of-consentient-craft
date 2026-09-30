/**
 * PURPOSE: Converts tsconfig.json include/exclude arrays into TypeScript-specific glob patterns for file discovery
 *
 * USAGE:
 * const { patterns, exclude } = tsconfigDiscoverPatternsTransformer({ tsconfigData: { include: ['src'], exclude: ['dist'] } });
 * // Returns: { patterns: ['src/**\/*.ts', 'src/**\/*.tsx'], exclude: ['node_modules', 'dist'] }
 */

import { tsconfigDiscoverPatternsContract } from '../../contracts/tsconfig-discover-patterns/tsconfig-discover-patterns-contract';
import type { TsconfigDiscoverPatterns } from '../../contracts/tsconfig-discover-patterns/tsconfig-discover-patterns-contract';
import { tsconfigJsonContract } from '../../contracts/tsconfig-json/tsconfig-json-contract';
import { checkCommandsStatics } from '../../statics/check-commands/check-commands-statics';
import { tsconfigDiscoverStatics } from '../../statics/tsconfig-discover/tsconfig-discover-statics';
import { expandToTsGlobsTransformer } from '../expand-to-ts-globs/expand-to-ts-globs-transformer';

export const tsconfigDiscoverPatternsTransformer = ({
  tsconfigData,
}: {
  tsconfigData: unknown;
}): TsconfigDiscoverPatterns => {
  const fallback = {
    patterns: checkCommandsStatics.typecheck.discoverPatterns.map((p) => p),
    exclude: [...tsconfigDiscoverStatics.defaultExclude],
  };

  const tsconfig = ((): ReturnType<typeof tsconfigJsonContract.parse> | null => {
    try {
      return tsconfigJsonContract.parse(tsconfigData);
    } catch {
      return null;
    }
  })();

  if (tsconfig?.include === undefined) {
    return tsconfigDiscoverPatternsContract.parse(fallback);
  }

  const patterns: string[] = [];

  for (const entry of tsconfig.include) {
    const expanded = expandToTsGlobsTransformer({
      pattern: String(entry),
    });
    patterns.push(...expanded);
  }

  if (patterns.length === 0) {
    return tsconfigDiscoverPatternsContract.parse(fallback);
  }

  const exclude: string[] = [...tsconfigDiscoverStatics.defaultExclude];
  if (tsconfig.exclude !== undefined) {
    for (const entry of tsconfig.exclude) {
      const parsed = String(entry);
      if (!exclude.includes(parsed)) {
        exclude.push(parsed);
      }
    }
  }

  return tsconfigDiscoverPatternsContract.parse({ patterns, exclude });
};
