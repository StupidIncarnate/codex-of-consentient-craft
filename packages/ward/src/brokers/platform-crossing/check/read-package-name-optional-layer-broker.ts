/**
 * PURPOSE: Reads one `package.json`'s `name` field, answering `undefined` when the file is absent
 * rather than throwing — the gateway folder a fixture repo did not build, or a repo that has not
 * scaffolded that gateway package yet. A read that fails for any OTHER reason (permission denied, a
 * directory in its place) still throws, so a real problem is never read as "package not built yet".
 *
 * USAGE:
 * await readPackageNameOptionalLayerBroker({ packageJsonPath: filePathContract.parse('/repo/packages/node/package.json') });
 * // Returns: '@dungeonmaster/node' as GatewayPackageName, or undefined when the file does not exist
 */

import { readFile } from '#gateway/node/fs__promises';

import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { isNodeErrorWithCodeGuard } from '../../../guards/is-node-error-with-code/is-node-error-with-code-guard';

export const readPackageNameOptionalLayerBroker = async ({
  packageJsonPath,
}: {
  packageJsonPath: string;
}): Promise<string | undefined> => {
  const raw = await readFile(packageJsonPath).catch((error: unknown) => {
    if (isNodeErrorWithCodeGuard({ error, code: 'ENOENT' })) {
      return undefined;
    }
    throw error;
  });

  if (raw === undefined) {
    return undefined;
  }

  const { name } = packageJsonContract.parse(JSON.parse(raw));
  return name === undefined ? undefined : name;
};
