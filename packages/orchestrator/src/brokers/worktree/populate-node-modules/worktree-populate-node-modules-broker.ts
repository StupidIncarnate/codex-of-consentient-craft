/**
 * PURPOSE: Makes a freshly created git worktree resolvable — every `@dungeonmaster/*` import inside
 * it reaches the worktree's own `packages/`, while third-party packages stay shared with the repo
 * root rather than copied. Covers the repo root's `node_modules` AND each workspace package's own
 * `node_modules`: npm hoists a package's version-conflicting dependencies into the package rather
 * than the root (packages/web carries the whole React tree that way), so a worktree mirroring only
 * the top level fails to resolve them and its build dies on a missing import.
 *
 * USAGE:
 * await worktreePopulateNodeModulesBroker({
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' }),
 * });
 * // Populates <worktreePath>/node_modules plus <worktreePath>/packages/<pkg>/node_modules
 */

import { locationsNodeModulesPathFindBroker } from '@dungeonmaster/shared/brokers';
import {
  filePathContract,
  type AbsoluteFilePath,
  type AdapterResult,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { populateOneRootLayerBroker } from './populate-one-root-layer-broker';

export const worktreePopulateNodeModulesBroker = async ({
  repoRoot,
  worktreePath,
}: {
  repoRoot: AbsoluteFilePath;
  worktreePath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const { workspacePackageRoots } = await populateOneRootLayerBroker({
    sourceRoot: repoRoot,
    targetRoot: worktreePath,
  });

  // The workspace packages are discovered from the links just mirrored rather than by globbing a
  // directory, so this stays correct for whatever layout npm actually produced. Only these roots are
  // visited — a package's own node_modules holds no workspace links to follow further.
  await Promise.all(
    workspacePackageRoots.map(async (pair) => {
      const hasNodeModules = await fsIsAccessibleAdapter({
        filePath: filePathContract.parse(
          locationsNodeModulesPathFindBroker({ rootPath: pair.sourceRoot }),
        ),
      });

      if (!hasNodeModules) {
        return;
      }

      await populateOneRootLayerBroker(pair);
    }),
  );

  return { success: true as const };
};
