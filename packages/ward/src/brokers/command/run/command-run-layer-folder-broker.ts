/**
 * PURPOSE: Reads package.json from a root path and returns a ProjectFolder for single-package mode
 *
 * USAGE:
 * const folder = await commandRunLayerFolderBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns ProjectFolder with name from package.json or rootPath as fallback
 */

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  projectFolderContract,
  type ProjectFolder,
} from '../../../contracts/project-folder/project-folder-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

export const commandRunLayerFolderBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<ProjectFolder> => {
  const pkgPath = filePathContract.parse(`${rootPath}/package.json`);
  try {
    const contents = await fsReadFileAdapter({ filePath: pkgPath });
    const parsed = packageJsonContract.parse(JSON.parse(contents));
    if (parsed.name !== undefined) {
      return projectFolderContract.parse({ name: String(parsed.name), path: String(rootPath) });
    }
  } catch {
    // fall through to default
  }
  return projectFolderContract.parse({ name: String(rootPath), path: String(rootPath) });
};
