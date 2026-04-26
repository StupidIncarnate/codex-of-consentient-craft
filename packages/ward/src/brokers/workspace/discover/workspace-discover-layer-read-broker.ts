/**
 * PURPOSE: Reads a single directory's package.json and returns a ProjectFolder or null if invalid or has no src/
 *
 * USAGE:
 * const folder = await workspaceDiscoverLayerReadBroker({ fullPath: '/project/packages/ward', rootPath });
 * // Returns ProjectFolder with name and path, or null if package.json missing, has no name, or has no src/ directory
 */

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  projectFolderContract,
  type ProjectFolder,
} from '../../../contracts/project-folder/project-folder-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirDirsAdapter } from '../../../adapters/fs/readdir-dirs/fs-readdir-dirs-adapter';

export const workspaceDiscoverLayerReadBroker = async ({
  fullPath,
}: {
  fullPath: string;
  rootPath: AbsoluteFilePath;
}): Promise<ProjectFolder | null> => {
  const pkgPath = filePathContract.parse(`${fullPath}/package.json`);
  try {
    const contents = await fsReadFileAdapter({ filePath: pkgPath });
    const parsed = packageJsonContract.parse(JSON.parse(contents));
    const { name } = parsed;
    if (typeof name !== 'string') {
      return null;
    }

    const dirPath = filePathContract.parse(fullPath);
    const dirs = await fsReaddirDirsAdapter({ dirPath }).catch(() => []);
    const hasSrc = dirs.some((dir) => String(dir) === 'src');

    if (!hasSrc) {
      process.stderr.write(`ward: skipping ${name} (no src/ directory)\n`);
      return null;
    }

    return projectFolderContract.parse({ name, path: fullPath });
  } catch {
    return null;
  }
};
