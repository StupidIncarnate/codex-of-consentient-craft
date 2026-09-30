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

import { join } from '#gateway/node/path';
import { readFile, writeFile } from '#gateway/node/fs__promises';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { packageJsonRawContract } from '@dungeonmaster/shared/contracts';
import { rootPackageJsonRegisterTransformer } from '../../../transformers/root-package-json-register/root-package-json-register-transformer';

export const packageRegisterBroker = async ({
  projectRoot,
  packageName,
}: {
  projectRoot: string;
  packageName: string;
}): Promise<boolean> => {
  const packageJsonPath = join(projectRoot, 'package.json');

  const rawContents = await readFile(packageJsonPath).catch((error: unknown) => {
    throw new Error(`No package.json found at ${packageJsonPath}`, { cause: error });
  });

  const rootPackageJson = packageJsonRawContract.parse(JSON.parse(rawContents));
  const updatedPackageJson = rootPackageJsonRegisterTransformer({ rootPackageJson, packageName });

  if (updatedPackageJson === rootPackageJson) {
    return false;
  }

  const contents = jsonFileContentsTransformer({ value: updatedPackageJson });

  await writeFile(packageJsonPath, contents);

  return true;
};
