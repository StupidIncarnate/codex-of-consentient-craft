/**
 * PURPOSE: Reads a package.json file at the given path and parses it as PackageJson, returning undefined on any error
 *
 * USAGE:
 * await readPackageJsonSafeLayerBroker({ pkgJsonPath: filePathContract.parse('/repo/packages/shared/package.json') });
 * // Returns: PackageJson if readable and valid, undefined if file is missing or unparseable
 */

import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

import {
  packageJsonContract,
  type PackageJson,
} from '../../../contracts/package-json/package-json-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

export const readPackageJsonSafeLayerBroker = async ({
  pkgJsonPath,
}: {
  pkgJsonPath: FilePath;
}): Promise<PackageJson | undefined> => {
  try {
    const contents = await fsReadFileAdapter({
      filePath: filePathContract.parse(String(pkgJsonPath)),
    });
    return packageJsonContract.parse(JSON.parse(String(contents)) as unknown);
  } catch {
    return undefined;
  }
};
