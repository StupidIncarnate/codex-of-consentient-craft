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

import { readFile } from '#gateway/node/fs__promises';
import { architecturePackageTypeDetectBroker } from '@dungeonmaster/shared/brokers';

import {
  platformCrossingViolationContract,
  type PlatformCrossingViolation,
} from '../../../contracts/platform-crossing-violation/platform-crossing-violation-contract';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { specifierMatchesPackageGuard } from '../../../guards/specifier-matches-package/specifier-matches-package-guard';
import { isImplementationSourceFileGuard } from '../../../guards/is-implementation-source-file/is-implementation-source-file-guard';
import { dedupePlatformCrossingViolationsTransformer } from '../../../transformers/dedupe-platform-crossing-violations/dedupe-platform-crossing-violations-transformer';
import { nonImplementationGlobsStatics } from '../../../statics/non-implementation-globs/non-implementation-globs-statics';
import { globDiscoverFilesBroker } from '../../glob/discover-files/glob-discover-files-broker';
import { gatewayPackageNamesReadLayerBroker } from './gateway-package-names-read-layer-broker';
import {
  walkGatewayCrossingsLayerBroker,
  type ModuleShapeCache,
  type ResolveSpecifierCache,
} from './walk-gateway-crossings-layer-broker';

const FRONTEND_REACT_TYPE = 'frontend-react';
const LIBRARY_TYPE = 'library';

export const platformCrossingCheckBroker = async ({
  rootPath,
}: {
  rootPath: string;
}): Promise<readonly PlatformCrossingViolation[]> => {
  const rootAbsolute = rootPath;
  const folders = (await workspaceDiscoverBroker({ rootPath: rootAbsolute })) ?? [];
  const gatewayNames = await gatewayPackageNamesReadLayerBroker({ rootPath });

  // Parsing and specifier resolution are platform-independent, so one pair of caches serves every
  // folder's walk. The chain memo is NOT platform-independent (a crossing is only a crossing
  // relative to a `forbiddenPackageNames` set), so it is split one-per-platform rather than shared
  // outright — the two platforms this broker ever computes (`browser`, `node`) never disagree with
  // each other about which files exist, only about which gateway packages are forbidden. Sharing
  // each cache across every folder (not just within one folder's own files) is what keeps the walk
  // linear in the repo's total file count rather than in (file count × discovered entry files): a
  // file every package imports (a shared broker, a common utility) is parsed, resolved and walked
  // once per (platform, requested-names) pair for the whole run, not once per entry file that
  // happens to reach it.
  const moduleShapeCache: ModuleShapeCache = new Map();
  const resolveCache: ResolveSpecifierCache = new Map();
  const chainMemoByPlatform = new Map<
    'browser' | 'node',
    Map<string, Promise<readonly string[][]>>
  >();

  const violationsPerFolder = await Promise.all(
    folders.map(async (folder): Promise<readonly PlatformCrossingViolation[]> => {
      const packageRoot = folder.path;
      const types = await architecturePackageTypeDetectBroker({ packageRoot });

      const platform = types.includes(FRONTEND_REACT_TYPE)
        ? ('browser' as const)
        : types.every((type) => type === LIBRARY_TYPE)
          ? undefined
          : ('node' as const);
      if (platform === undefined) {
        return [];
      }

      const memo: Map<string, Promise<readonly string[][]>> = chainMemoByPlatform.get(platform) ??
      new Map<string, Promise<readonly string[][]>>();
      if (!chainMemoByPlatform.has(platform)) {
        chainMemoByPlatform.set(platform, memo);
      }

      const forbiddenPackageNames: readonly string[] = (
        platform === 'browser' ? [gatewayNames.node, gatewayNames.bin] : [gatewayNames.browser]
      ).filter((name) => name !== undefined);
      if (forbiddenPackageNames.length === 0) {
        return [];
      }

      const { discoveredFiles } = globDiscoverFilesBroker({
        patterns: ['src/**/*.ts', 'src/**/*.tsx'],
        cwd: packageRoot,
        exclude: nonImplementationGlobsStatics,
      });

      const violationsPerFile = await Promise.all(
        discoveredFiles.map(async (relativeFile): Promise<readonly PlatformCrossingViolation[]> => {
          const absoluteFile = `${folder.path}/${relativeFile}`;
          if (!isImplementationSourceFileGuard({ filePath: absoluteFile })) {
            return [];
          }

          const content = await readFile(absoluteFile);

          const chains = await walkGatewayCrossingsLayerBroker({
            filePath: absoluteFile,
            content,
            requestedNames: 'all',
            pathHistory: [absoluteFile],
            chainLabels: [],
            knownPackages: folders,
            forbiddenPackageNames,
            memo,
            moduleShapeCache,
            resolveCache,
          });

          return chains.map((chain) => {
            const lastHop = chain.at(-1);
            if (lastHop === undefined) {
              throw new Error('walkGatewayCrossingsLayerBroker reported an empty chain');
            }
            const crossedGatewayPackage =
              forbiddenPackageNames.find((name) =>
                specifierMatchesPackageGuard({ specifier: lastHop, packageName: name }),
              ) ?? lastHop;

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
