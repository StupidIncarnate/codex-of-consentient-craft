/**
 * PURPOSE: Reads a single directory's package.json and returns a ProjectFolder or null if invalid
 *
 * USAGE:
 * const folder = await workspaceDiscoverLayerReadBroker({ fullPath: '/project/packages/ward', rootPath });
 * // Returns ProjectFolder with name and path, or null if package.json missing or has no name
 */

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  projectFolderContract,
  type ProjectFolder,
} from '../../../contracts/project-folder/project-folder-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

export const workspaceDiscoverLayerReadBroker = async ({
  fullPath,
}: {
  fullPath: string;
  rootPath: AbsoluteFilePath;
}): Promise<ProjectFolder | null> => {
  const pkgPath = filePathContract.parse(`${fullPath}/package.json`);
  try {
    const contents = await fsReadFileAdapter({ filePath: pkgPath });
    const parsed: unknown = JSON.parse(contents);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    const name: unknown = Reflect.get(parsed, 'name');
    if (typeof name !== 'string') {
      return null;
    }
    return projectFolderContract.parse({ name, path: fullPath });
  } catch {
    return null;
  }
};
