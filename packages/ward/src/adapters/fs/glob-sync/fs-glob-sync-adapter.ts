/**
 * PURPOSE: Counts files matching glob patterns in a directory using Node's fs.globSync
 *
 * USAGE:
 * const count = fsGlobSyncAdapter({patterns: ['src/**\/*.ts'], cwd: absoluteFilePathContract.parse('/project')});
 * // Returns: DiscoveredCount branded number of matching files
 */

import { globSync } from 'fs';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';

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
}): DiscoveredCount => {
  let count = 0;
  for (const pattern of patterns) {
    const matches = globSync(pattern, {
      cwd,
      ...(exclude === undefined ? {} : { exclude: [...exclude] }),
    });
    count += matches.length;
  }
  return discoveredCountContract.parse(count);
};
