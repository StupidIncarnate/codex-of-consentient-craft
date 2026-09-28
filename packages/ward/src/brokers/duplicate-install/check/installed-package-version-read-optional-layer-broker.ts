/**
 * PURPOSE: Reads one installed copy's `<dir>/node_modules/<name>/package.json` `version` field,
 * answering `undefined` when that copy is not installed there rather than throwing — most
 * (location, name) pairs `duplicateInstallCheckBroker` probes resolve nowhere at all. A read that
 * fails for any OTHER reason (permission denied, a directory in its place) still throws, so a real
 * problem is never read as "not installed here".
 *
 * USAGE:
 * await installedPackageVersionReadOptionalLayerBroker({ packageJsonPath: filePathContract.parse('/repo/packages/web/node_modules/@mantine/core/package.json') });
 * // Returns: '8.3.14' as InstalledPackageVersion, or undefined when the file does not exist
 */

import { readFile } from '#gateway/node/fs__promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { installedPackageManifestContract } from '../../../contracts/installed-package-manifest/installed-package-manifest-contract';
import type { InstalledPackageVersion } from '../../../contracts/installed-package-version/installed-package-version-contract';
import { isNodeErrorWithCodeGuard } from '../../../guards/is-node-error-with-code/is-node-error-with-code-guard';

export const installedPackageVersionReadOptionalLayerBroker = async ({
  packageJsonPath,
}: {
  packageJsonPath: FilePath;
}): Promise<InstalledPackageVersion | undefined> => {
  const raw = await readFile(packageJsonPath).catch((error: unknown) => {
    if (isNodeErrorWithCodeGuard({ error, code: 'ENOENT' })) {
      return undefined;
    }
    throw error;
  });

  if (raw === undefined) {
    return undefined;
  }

  const { version } = installedPackageManifestContract.parse(JSON.parse(raw));
  return version;
};
