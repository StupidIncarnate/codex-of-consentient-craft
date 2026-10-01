/**
 * PURPOSE: Every module mock the repo's npm gateway holds — each
 * `packages/@gateway/npm/src/<folder>/<folder>.jest-mock.cjs`, keyed by both `#gateway/npm/<folder>`
 * and the raw package name its barrel re-exports. The Jest resolver both Jest base configs set looks
 * a request up here, so a test that imports a mocked gateway gets the mock and a test that does not
 * never loads it. The npm gateway package's own run gets nothing: its wrappers' tests and stubs need
 * the real modules.
 *
 * USAGE:
 * gatewayModuleMockMapBroker({ rootDir: '/repo/packages/web' });
 * // Returns { '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs', elkjs: '/repo/...', ... }; {} with no npm gateway above rootDir, or for the npm gateway itself
 */

import { existsSync, findUpSync, readFileSyncIfExists, readdirEntriesSync } from '#gateway/node/fs';
import { join, resolve, sep } from '#gateway/node/path';
import { gatewayModuleMockMapContract } from '../../../contracts/gateway-module-mock-map/gateway-module-mock-map-contract';
import type { GatewayModuleMockMap } from '../../../contracts/gateway-module-mock-map/gateway-module-mock-map-contract';
import { gatewayModuleMockStatics } from '../../../statics/gateway-module-mock/gateway-module-mock-statics';
import { barrelReexportPackageNameTransformer } from '../../../transformers/barrel-reexport-package-name/barrel-reexport-package-name-transformer';
import { gatewayModuleMockSpecifiersTransformer } from '../../../transformers/gateway-module-mock-specifiers/gateway-module-mock-specifiers-transformer';

export const gatewayModuleMockMapBroker = ({
  rootDir,
}: {
  rootDir: string;
}): GatewayModuleMockMap => {
  const { locations, files } = gatewayModuleMockStatics;
  const ownDir = resolve(rootDir);
  const npmGatewayDir = findUpSync({ startDir: ownDir, fileName: locations.npmGatewayDir });

  if (
    npmGatewayDir === null ||
    ownDir === npmGatewayDir ||
    ownDir.startsWith(`${npmGatewayDir}${sep}`)
  ) {
    return gatewayModuleMockMapContract.parse({});
  }

  const srcDir = join(npmGatewayDir, locations.srcDir);
  if (!existsSync(srcDir)) {
    return gatewayModuleMockMapContract.parse({});
  }

  const entries = readdirEntriesSync(srcDir)
    .filter((entry) => entry.kind === 'directory')
    .map((entry) => entry.name)
    .sort()
    .flatMap((folder) => {
      const mockPath = join(srcDir, folder, `${folder}${files.mockSuffix}`);
      if (!existsSync(mockPath)) {
        return [];
      }
      const barrelText = readFileSyncIfExists(
        join(srcDir, folder, `${folder}${files.barrelExtension}`),
      );
      const packageName =
        barrelText === null ? null : barrelReexportPackageNameTransformer({ barrelText });
      return [gatewayModuleMockSpecifiersTransformer({ folder, packageName, mockPath })];
    });

  return gatewayModuleMockMapContract.parse(Object.assign({}, ...entries));
};
