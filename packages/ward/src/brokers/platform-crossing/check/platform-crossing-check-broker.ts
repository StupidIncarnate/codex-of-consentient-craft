/**
 * PURPOSE: The platform-crossing check's entry point. Starts from every workspace package's own
 * production files, classifies each package's platform through dungeonmaster's own package-type
 * detection, and walks the import graph looking for a browser-platform package reaching
 * `@scope/node`/`@scope/bin`, or a node-platform package reaching `@scope/browser` — the mirror
 * case. A `library`-typed package has no platform of its own (Defaults item 6 in
 * `scrolls/adapters-to-one-place.md`) and is skipped in both directions.
 *
 * USAGE:
 * await platformCrossingCheckBroker({rootPath: filePathContract.parse('/repo')});
 * // Returns: readonly PlatformCrossingViolation[] — empty when nothing crosses
 */

import {
  absoluteFilePathContract,
  filePathContract,
  packageTypeContract,
  type FilePath,
} from '@dungeonmaster/shared/contracts';
import { architecturePackageTypeDetectBroker } from '@dungeonmaster/shared/brokers';

import {
  platformCrossingViolationContract,
  type PlatformCrossingViolation,
} from '../../../contracts/platform-crossing-violation/platform-crossing-violation-contract';
import { gatewayPackageNameContract } from '../../../contracts/gateway-package-name/gateway-package-name-contract';
import type { GatewayPackageName } from '../../../contracts/gateway-package-name/gateway-package-name-contract';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { specifierMatchesPackageGuard } from '../../../guards/specifier-matches-package/specifier-matches-package-guard';
import { isImplementationSourceFileGuard } from '../../../guards/is-implementation-source-file/is-implementation-source-file-guard';
import { dedupePlatformCrossingViolationsTransformer } from '../../../transformers/dedupe-platform-crossing-violations/dedupe-platform-crossing-violations-transformer';
import { nonImplementationGlobsStatics } from '../../../statics/non-implementation-globs/non-implementation-globs-statics';
import { fsGlobSyncAdapter } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { gatewayPackageNamesReadLayerBroker } from './gateway-package-names-read-layer-broker';
import { walkGatewayCrossingsLayerBroker } from './walk-gateway-crossings-layer-broker';

const FRONTEND_REACT_TYPE = packageTypeContract.parse('frontend-react');
const LIBRARY_TYPE = packageTypeContract.parse('library');

export const platformCrossingCheckBroker = async ({
  rootPath,
}: {
  rootPath: FilePath;
}): Promise<readonly PlatformCrossingViolation[]> => {
  const rootAbsolute = absoluteFilePathContract.parse(rootPath);
  const folders = (await workspaceDiscoverBroker({ rootPath: rootAbsolute })) ?? [];
  const gatewayNames = await gatewayPackageNamesReadLayerBroker({ rootPath });

  const violationsPerFolder = await Promise.all(
    folders.map(async (folder): Promise<readonly PlatformCrossingViolation[]> => {
      const packageRoot = absoluteFilePathContract.parse(folder.path);
      const types = await architecturePackageTypeDetectBroker({ packageRoot });

      const platform = types.includes(FRONTEND_REACT_TYPE)
        ? ('browser' as const)
        : types.every((type) => type === LIBRARY_TYPE)
          ? undefined
          : ('node' as const);
      if (platform === undefined) {
        return [];
      }

      const forbiddenPackageNames: readonly GatewayPackageName[] = (
        platform === 'browser' ? [gatewayNames.node, gatewayNames.bin] : [gatewayNames.browser]
      ).filter((name): name is GatewayPackageName => name !== undefined);
      if (forbiddenPackageNames.length === 0) {
        return [];
      }

      const { discoveredFiles } = fsGlobSyncAdapter({
        patterns: ['src/**/*.ts', 'src/**/*.tsx'],
        cwd: packageRoot,
        exclude: nonImplementationGlobsStatics,
      });

      const violationsPerFile = await Promise.all(
        discoveredFiles.map(async (relativeFile): Promise<readonly PlatformCrossingViolation[]> => {
          const absoluteFile = filePathContract.parse(`${folder.path}/${relativeFile}`);
          if (!isImplementationSourceFileGuard({ filePath: absoluteFile })) {
            return [];
          }

          const content = await fsReadFileAdapter({ filePath: absoluteFile });

          const chains = await walkGatewayCrossingsLayerBroker({
            filePath: absoluteFile,
            content,
            requestedNames: 'all',
            pathHistory: [absoluteFile],
            chainLabels: [],
            knownPackages: folders,
            forbiddenPackageNames,
          });

          return chains.map((chain) => {
            const lastHop = chain.at(-1);
            if (lastHop === undefined) {
              throw new Error('walkGatewayCrossingsLayerBroker reported an empty chain');
            }
            const crossedGatewayPackage =
              forbiddenPackageNames.find((name) =>
                specifierMatchesPackageGuard({ specifier: lastHop, packageName: name }),
              ) ?? gatewayPackageNameContract.parse(lastHop);

            return platformCrossingViolationContract.parse({
              packageName: folder.name,
              platform,
              chain,
              crossedGatewayPackage,
            });
          });
        }),
      );

      return violationsPerFile.flat();
    }),
  );

  return dedupePlatformCrossingViolationsTransformer({ violations: violationsPerFolder.flat() });
};
