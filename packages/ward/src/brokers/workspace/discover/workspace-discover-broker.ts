/**
 * PURPOSE: Reads workspaces from root package.json and resolves patterns to ProjectFolder array, or null for single-package mode
 *
 * USAGE:
 * const folders = await workspaceDiscoverBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns ProjectFolder[] if workspaces field found, null if no workspaces (single-package mode)
 */

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { workspaceDiscoverLayerPatternBroker } from './workspace-discover-layer-pattern-broker';

export const workspaceDiscoverBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<ProjectFolder[] | null> => {
  const pkgPath = filePathContract.parse(`${rootPath}/package.json`);

  const raw = await fsReadFileAdapter({ filePath: pkgPath }).catch(() => null);
  if (raw === null) {
    return null;
  }

  const parsed: unknown = (() => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  })();

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const workspaces: unknown = Reflect.get(parsed, 'workspaces');

  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    return null;
  }

  const resolvedGroups = await Promise.all(
    workspaces.map(async (w) => {
      if (typeof w !== 'string') {
        return [] as ProjectFolder[];
      }
      return workspaceDiscoverLayerPatternBroker({ pattern: w, rootPath });
    }),
  );

  return resolvedGroups.flat();
};
