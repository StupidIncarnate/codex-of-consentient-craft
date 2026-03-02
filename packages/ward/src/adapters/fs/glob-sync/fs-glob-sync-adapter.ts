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
  const allFiles: GitRelativePath[] = [];
  for (const pattern of patterns) {
    const matches = globSync(pattern, {
      cwd,
      ...(exclude === undefined ? {} : { exclude: [...exclude] }),
    });
    allFiles.push(...matches.map((match) => gitRelativePathContract.parse(match)));
  }
  return {
    discoveredCount: discoveredCountContract.parse(allFiles.length),
    discoveredFiles: allFiles,
  };
};
