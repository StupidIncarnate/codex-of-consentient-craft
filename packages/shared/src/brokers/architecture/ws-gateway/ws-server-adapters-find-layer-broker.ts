/**
 * PURPOSE: Walks all monorepo source files under `adapters/` folders and returns the
 * paths of those whose source contains an import statement whose specifier matches a
 * WebSocket-server npm package from `wsServerNpmPackagesStatics`. The resulting set
 * is the canonical "WS-server adapter" list — repo-agnostic detection by npm package.
 *
 * USAGE:
 * const adapters = wsServerAdaptersFindLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns AbsoluteFilePath[] for every adapter file wrapping a WS-server library
 *
 * WHEN-TO-USE: Project-map WS-edge composer needing to attribute WS frames to the
 * package that owns the WebSocket transport, regardless of repo-specific naming.
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { wsServerNpmPackagesStatics } from '../../../statics/ws-server-npm-packages/ws-server-npm-packages-statics';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';
const ADAPTERS_PATH_SEGMENT = '/adapters/';

export const wsServerAdaptersFindLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const knownPackages = wsServerNpmPackagesStatics.npmPackages;
  const adapters: AbsoluteFilePath[] = [];

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) continue;
    if (!String(filePath).includes(ADAPTERS_PATH_SEGMENT)) continue;
    const source = readFileLayerBroker({ filePath });
    if (source === undefined) continue;
    const imports = importStatementsExtractTransformer({ source });
    for (const importPath of imports) {
      if (knownPackages.some((pkg) => String(importPath) === pkg)) {
        adapters.push(filePath);
        break;
      }
    }
  }

  return adapters;
};
