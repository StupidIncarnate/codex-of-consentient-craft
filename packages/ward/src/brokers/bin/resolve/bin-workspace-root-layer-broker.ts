/**
 * PURPOSE: Answers whether `<dir>/package.json` declares a non-empty `workspaces` array, which is
 * what makes `dir` the workspace root the bin walk stops at. An unreadable or malformed
 * package.json answers false, so the walk keeps climbing.
 *
 * USAGE:
 * binWorkspaceRootLayerBroker({ dir: AbsoluteFilePathStub({ value: '/repo' }) });
 * // Returns true when /repo/package.json has workspaces: ['packages/*']
 */

import { readFileSyncIfExists } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { packageJsonContract } from '@dungeonmaster/shared/contracts';

export const binWorkspaceRootLayerBroker = ({ dir }: { dir: string }): boolean => {
  const raw = readFileSyncIfExists(join(dir, 'package.json'));
  if (raw === null) {
    return false;
  }

  const parsed = ((): ReturnType<typeof packageJsonContract.parse> | null => {
    try {
      return packageJsonContract.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  })();

  return parsed?.workspaces !== undefined && parsed.workspaces.length > 0;
};
