/**
 * PURPOSE: Reads `packages/@gateway/node`, `packages/@gateway/bin` and `packages/@gateway/browser`'s
 * own `package.json` `name` field off disk, so the platform-crossing walk knows which import
 * specifiers are forbidden for each platform without hardcoding a scope. A repo that has not
 * scaffolded one of the three yet (or a fixture repo that only builds the pieces a test needs)
 * simply leaves that field absent.
 *
 * USAGE:
 * await gatewayPackageNamesReadLayerBroker({rootPath: filePathContract.parse('/repo')});
 * // Returns: { node: '@dungeonmaster/node', bin: '@dungeonmaster/bin', browser: '@dungeonmaster/browser' }
 */


import {
  gatewayPackageNamesContract,
  type GatewayPackageNames,
} from '../../../contracts/gateway-package-names/gateway-package-names-contract';
import { gatewayFolderNamesStatics } from '../../../statics/gateway-folder-names/gateway-folder-names-statics';
import { readPackageNameOptionalLayerBroker } from './read-package-name-optional-layer-broker';

export const gatewayPackageNamesReadLayerBroker = async ({
  rootPath,
}: {
  rootPath: string;
}): Promise<GatewayPackageNames> => {
  const [node, bin, browser] = await Promise.all(
    gatewayFolderNamesStatics.map(async (folderName) =>
      readPackageNameOptionalLayerBroker({
        packageJsonPath: `${rootPath}/packages/@gateway/${folderName}/package.json`,
      }),
    ),
  );

  // `exactOptionalPropertyTypes` distinguishes an absent key from one explicitly set to
  // `undefined` — spreading conditionally is what keeps a repo missing `packages/bin` from
  // reporting `{node: '…', bin: undefined, browser: undefined}` instead of just `{node: '…'}`.
  return gatewayPackageNamesContract.parse({
    ...(node === undefined ? {} : { node }),
    ...(bin === undefined ? {} : { bin }),
    ...(browser === undefined ? {} : { browser }),
  });
};
