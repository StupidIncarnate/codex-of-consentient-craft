/**
 * PURPOSE: Applies rootPackageJsonRegisterTransformer's computed edit to the ROOT package.json on disk,
 * so `dungeonmaster create-package` takes the registration step itself instead of leaving it to a human
 * to remember. Reach for this over install-add-dev-deps-responder's read/parse/merge/write cycle when the
 * target is the monorepo root (not a consumer project's package.json) and a missing file is a hard stop
 * rather than a skip.
 *
 * USAGE:
 * const changed = await packageRegisterBroker({ projectRoot, packageName });
 * // Returns false and writes nothing when packageName is already a root dependency
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  type FilePath,
  type PackageName,
} from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';
import { packageScaffoldConfigStatics } from '../../../statics/package-scaffold-config/package-scaffold-config-statics';
import { rootPackageJsonRegisterTransformer } from '../../../transformers/root-package-json-register/root-package-json-register-transformer';

export const packageRegisterBroker = async ({
  projectRoot,
  packageName,
}: {
  projectRoot: FilePath;
  packageName: PackageName;
}): Promise<boolean> => {
  const packageJsonPath = pathJoinAdapter({ paths: [projectRoot, 'package.json'] });

  const rawContents = await fsReadFileAdapter({ filePath: packageJsonPath }).catch(
    (error: unknown) => {
      throw new Error(`No package.json found at ${packageJsonPath}`, { cause: error });
    },
  );

  const rootPackageJson = packageJsonRawContract.parse(JSON.parse(rawContents));
  const updatedPackageJson = rootPackageJsonRegisterTransformer({ rootPackageJson, packageName });

  if (updatedPackageJson === rootPackageJson) {
    return false;
  }

  const contents = fileContentsContract.parse(
    `${JSON.stringify(updatedPackageJson, null, packageScaffoldConfigStatics.jsonIndentSpaces)}\n`,
  );

  await fsWriteFileAdapter({ filePath: packageJsonPath, contents });

  return true;
};
