/**
 * PURPOSE: Reads workspaces from root package.json and resolves patterns to ProjectFolder array, or null for single-package mode
 *
 * USAGE:
 * const folders = await workspaceDiscoverBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns ProjectFolder[] if workspaces field found, null if no workspaces (single-package mode)
 */

import { readFile } from '#gateway/node/fs__promises';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { packageJsonContract } from '@dungeonmaster/shared/contracts';
import { patternResolveLayerBroker } from './pattern-resolve-layer-broker';

export const workspaceDiscoverBroker = async ({
  rootPath,
}: {
  rootPath: string;
}): Promise<ProjectFolder[] | null> => {
  const pkgPath = `${rootPath}/package.json`;

  const raw = await readFile(pkgPath).catch(() => null);
  if (raw === null) {
    return null;
  }

  const parsed = ((): ReturnType<typeof packageJsonContract.parse> | null => {
    try {
      return packageJsonContract.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  })();

  if (parsed === null) {
    return null;
  }

  const { workspaces } = parsed;

  if (workspaces === undefined || workspaces.length === 0) {
    return null;
  }

  const resolvedGroups = await Promise.all(
    workspaces.map(async (w) => patternResolveLayerBroker({ pattern: String(w), rootPath })),
  );

  return resolvedGroups.flat();
};
