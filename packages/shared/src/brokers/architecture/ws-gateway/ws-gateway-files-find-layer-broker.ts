/**
 * PURPOSE: Walks all non-test, non-adapter, non-gateway source files in `packages/` and returns
 * those that either import one of the WS-server adapters or directly import a known WS-server
 * npm package (or its #gateway/npm/... path). Each returned file is a "WS gateway" — the file
 * responsible for owning the WebSocket transport boundary in its package.
 *
 * USAGE:
 * const gateways = wsGatewayFilesFindLayerBroker({
 *   projectRoot: '/repo',
 *   wsServerAdapters: [...adapterPaths],
 * });
 * // Returns AbsoluteFilePath[] for every file that owns a WebSocket transport boundary
 *
 * WHEN-TO-USE: Project-map WS-edge composer wanting to attribute a `ws←` arrow to the
 * gateway file rather than the orchestrator-side bus emitter.
 */

import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { wsServerNpmPackagesStatics } from '../../../statics/ws-server-npm-packages/ws-server-npm-packages-statics';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { gatewayPathFromImportSourceTransformer } from '../../../transformers/gateway-path-from-import-source/gateway-path-from-import-source-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';
const ADAPTERS_PATH_SEGMENT = '/adapters/';
const GATEWAY_PKG_SEGMENT = '/packages/@gateway/';

export const wsGatewayFilesFindLayerBroker = ({
  projectRoot,
  wsServerAdapters,
}: {
  projectRoot: string;
  wsServerAdapters: string[];
}): string[] => {
  const root = projectRoot;
  const packagesDir = `${root}/${PACKAGES_REL}`;
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const knownPackages = wsServerNpmPackagesStatics.npmPackages;
  const adapterPathSet = new Set<string>(wsServerAdapters);
  const gateways: string[] = [];

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) continue;
    // Skip adapter files and gateway wrapper packages — the gateway is the higher-layer file consuming them.
    if (filePath.includes(ADAPTERS_PATH_SEGMENT)) continue;
    if (filePath.includes(GATEWAY_PKG_SEGMENT)) continue;

    const source = readFileLayerBroker({ filePath });
    if (source === undefined) continue;
    const imports = importStatementsExtractTransformer({ source });

    for (const importPath of imports) {
      if (adapterPathSet.size > 0) {
        const resolved = relativeImportResolveTransformer({
          sourceFile: filePath,
          importPath,
        });
        if (resolved !== null && adapterPathSet.has(resolved)) {
          gateways.push(filePath);
          break;
        }
      }

      const isDirectWs = knownPackages.some((pkg) => {
        if (importPath === pkg || importPath.startsWith(`${pkg}/`)) {
          return true;
        }
        const gwPath = gatewayPathFromImportSourceTransformer({
          importSource: pkg,
          builtinModules: [],
        });
        return importPath === gwPath || importPath.startsWith(`${gwPath}/`);
      });

      if (isDirectWs) {
        gateways.push(filePath);
        break;
      }
    }
  }

  return gateways;
};
