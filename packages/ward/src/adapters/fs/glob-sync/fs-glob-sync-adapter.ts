/**
 * PURPOSE: Discovers files matching glob patterns in a directory using Node's fs.globSync
 *
 * USAGE:
 * const { discoveredCount, discoveredFiles } = fsGlobSyncAdapter({patterns: ['src/**\/*.ts'], cwd: absoluteFilePathContract.parse('/project')});
 * // Returns: { discoveredCount: DiscoveredCount, discoveredFiles: GitRelativePath[] }
 */

import { globSync } from 'fs';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../../contracts/git-relative-path/git-relative-path-contract';

type DiscoveredCount = ProjectResult['discoveredCount'];

const discoveredCountContract = projectResultContract.shape.discoveredCount;

export const fsGlobSyncAdapter = ({
  patterns,
  cwd,
  exclude,
}: {
  patterns: readonly string[];
  cwd: AbsoluteFilePath;
  exclude?: readonly string[];
}): { discoveredCount: DiscoveredCount; discoveredFiles: GitRelativePath[] } => {
  const seen = new Set<GitRelativePath>();
  const uniqueFiles: GitRelativePath[] = [];
  for (const pattern of patterns) {
    const matches = globSync(pattern, {
      cwd,
      ...(exclude === undefined ? {} : { exclude: [...exclude] }),
    });
    for (const match of matches) {
      const parsed = gitRelativePathContract.parse(match);
      if (!seen.has(parsed)) {
        seen.add(parsed);
        uniqueFiles.push(parsed);
      }
    }
  }
  return {
    discoveredCount: discoveredCountContract.parse(uniqueFiles.length),
    discoveredFiles: uniqueFiles,
  };
};
