/**
 * PURPOSE: Reads a single package.json file and extracts the project folder name and path
 *
 * USAGE:
 * const folder = await projectFolderDiscoverLayerReadBroker({ relativePath: 'packages/ward/package.json', rootPath });
 * // Returns ProjectFolder or null if the file cannot be read or has no name
 */

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import {
  projectFolderContract,
  type ProjectFolder,
} from '../../../contracts/project-folder/project-folder-contract';

export const projectFolderDiscoverLayerReadBroker = async ({
  relativePath,
  rootPath,
}: {
  relativePath: string;
  rootPath: AbsoluteFilePath;
}): Promise<ProjectFolder | null> => {
  const fullPath = filePathContract.parse(`${rootPath}/${relativePath}`);

  try {
    const contents = await fsReadFileAdapter({ filePath: fullPath });
    const parsed: unknown = JSON.parse(contents);

    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const name: unknown = Reflect.get(parsed, 'name');

    if (typeof name !== 'string') {
      return null;
    }

    const dirPath = relativePath.replace('/package.json', '');
    const fullDirPath = dirPath === relativePath ? String(rootPath) : `${rootPath}/${dirPath}`;

    return projectFolderContract.parse({
      name,
      path: fullDirPath,
    });
  } catch {
    return null;
  }
};
