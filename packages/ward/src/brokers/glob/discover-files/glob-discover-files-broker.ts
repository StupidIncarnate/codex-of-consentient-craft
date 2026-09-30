/**
 * PURPOSE: Discovers files matching one or more glob patterns under a directory, de-duplicating
 * matches that more than one pattern reports (two extension-specific patterns can both hit the
 * same file).
 *
 * USAGE:
 * const { discoveredCount, discoveredFiles } = globDiscoverFilesBroker({patterns: ['src/**\/*.ts'], cwd: absoluteFilePathContract.parse('/project')});
 * // Returns: { discoveredCount: DiscoveredCount, discoveredFiles: GitRelativePath[] }
 */

import { globDiscoverFilesResultContract } from '../../../contracts/glob-discover-files-result/glob-discover-files-result-contract';
import type { GlobDiscoverFilesResult } from '../../../contracts/glob-discover-files-result/glob-discover-files-result-contract';
import { globSync } from '#gateway/node/fs';

import { projectResultContract } from '../../../contracts/project-result/project-result-contract';

const discoveredCountContract = projectResultContract.shape.discoveredCount;

export const globDiscoverFilesBroker = ({
  patterns,
  cwd,
  exclude,
}: {
  patterns: readonly string[];
  cwd: string;
  exclude?: readonly string[];
}): GlobDiscoverFilesResult => {
  const seen = new Set<string>();
  const uniqueFiles: string[] = [];
  for (const pattern of patterns) {
    const matches = globSync({
      patterns: pattern,
      cwd,
      ...(exclude === undefined ? {} : { exclude: [...exclude] }),
    });
    for (const match of matches) {
      const parsed = match;
      if (!seen.has(parsed)) {
        seen.add(parsed);
        uniqueFiles.push(parsed);
      }
    }
  }
  return globDiscoverFilesResultContract.parse({
    discoveredCount: discoveredCountContract.parse(uniqueFiles.length),
    discoveredFiles: uniqueFiles,
  });
};
