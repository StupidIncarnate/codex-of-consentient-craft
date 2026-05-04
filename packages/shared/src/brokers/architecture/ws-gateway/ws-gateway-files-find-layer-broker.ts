/**
 * PURPOSE: Given a list of WS-server adapter file paths (produced by
 * `wsServerAdaptersFindLayerBroker`), walks all non-test, non-adapter source files in
 * `packages/` and returns those whose imports resolve to one of the WS-server adapters.
 * Each returned file is a "WS gateway" — the file responsible for owning the WebSocket
 * transport boundary in its package.
 *
 * USAGE:
 * const gateways = wsGatewayFilesFindLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   wsServerAdapters: [...adapterPaths],
 * });
 * // Returns AbsoluteFilePath[] for every file that imports one of the WS-server adapters
 *
 * WHEN-TO-USE: Project-map WS-edge composer wanting to attribute a `ws←` arrow to the
 * gateway file rather than the orchestrator-side bus emitter.
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';
const ADAPTERS_PATH_SEGMENT = '/adapters/';

export const wsGatewayFilesFindLayerBroker = ({
  projectRoot,
  wsServerAdapters,
}: {
  projectRoot: AbsoluteFilePath;
  wsServerAdapters: AbsoluteFilePath[];
}): AbsoluteFilePath[] => {
  if (wsServerAdapters.length === 0) return [];

  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const adapterPathSet = new Set<AbsoluteFilePath>(wsServerAdapters);
  const gateways: AbsoluteFilePath[] = [];

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) continue;
    // Skip adapter files — the gateway is the higher-layer file consuming an adapter.
    if (String(filePath).includes(ADAPTERS_PATH_SEGMENT)) continue;
    const source = readFileLayerBroker({ filePath });
    if (source === undefined) continue;
    const imports = importStatementsExtractTransformer({ source });
    for (const importPath of imports) {
      const resolved = relativeImportResolveTransformer({
        sourceFile: filePath,
        importPath,
      });
      if (resolved !== null && adapterPathSet.has(resolved)) {
        gateways.push(filePath);
        break;
      }
    }
  }

  return gateways;
};
