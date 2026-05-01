/**
 * PURPOSE: Scans all monorepo source files to produce ImportEdge records representing
 * cross-package barrel import relationships aggregated by (consumerPackage, sourcePackage,
 * barrel) triple.
 *
 * USAGE:
 * const edges = architectureImportEdgesBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns ImportEdge[] grouped by (consumerPackage, sourcePackage, barrel)
 *
 * WHEN-TO-USE: Library headline renderer consumer aggregation; project-map EDGES footer
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (regex v1 heuristic)
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import {
  importEdgeContract,
  type ImportEdge,
} from '../../../contracts/import-edge/import-edge-contract';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { readSourceLayerBroker } from './read-source-layer-broker';
import { listTsFilesRecursiveLayerBroker } from './list-ts-files-recursive-layer-broker';

const PACKAGES_REL = 'packages';
const DUNGEONMASTER_SCOPE = '@dungeonmaster/';

export const architectureImportEdgesBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): ImportEdge[] => {
  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);

  const packageEntries = safeReaddirLayerBroker({ dirPath: packagesDir });
  if (packageEntries.length === 0) {
    return [];
  }

  const knownPackageNames = new Set<ContentText>();
  for (const entry of packageEntries) {
    if (entry.isDirectory() && entry.name !== 'CLAUDE.md') {
      knownPackageNames.add(contentTextContract.parse(entry.name));
    }
  }

  const edgeFileMap = new Map<ContentText, Set<AbsoluteFilePath>>();
  const edgeMeta = new Map<
    ContentText,
    { consumerPackage: ContentText; sourcePackage: ContentText; barrel: ContentText }
  >();

  for (const consumerPkg of knownPackageNames) {
    const consumerPkgName = String(consumerPkg);
    const pkgSrcDir = absoluteFilePathContract.parse(
      `${root}/${PACKAGES_REL}/${consumerPkgName}/src`,
    );

    const allFiles = listTsFilesRecursiveLayerBroker({ dirPath: pkgSrcDir });

    for (const filePath of allFiles) {
      const source = readSourceLayerBroker({ filePath });
      if (source === undefined) {
        continue;
      }

      const importPaths = importStatementsExtractTransformer({ source });

      for (const importPath of importPaths) {
        const importStr = String(importPath);

        if (!importStr.startsWith(DUNGEONMASTER_SCOPE)) {
          continue;
        }

        const afterScope = importStr.slice(DUNGEONMASTER_SCOPE.length);
        const slashIndex = afterScope.indexOf('/');
        const sourcePackageName = slashIndex === -1 ? afterScope : afterScope.slice(0, slashIndex);

        const isKnownPackage = [...knownPackageNames].some((p) => String(p) === sourcePackageName);
        if (!isKnownPackage) {
          continue;
        }

        if (sourcePackageName === consumerPkgName) {
          continue;
        }

        const adapterWrapperPrefix = `${root}/${PACKAGES_REL}/${consumerPkgName}/src/adapters/${sourcePackageName}/`;
        if (String(filePath).startsWith(adapterWrapperPrefix)) {
          continue;
        }

        const sourcePackage = contentTextContract.parse(sourcePackageName);
        const barrel = contentTextContract.parse(
          slashIndex === -1 ? '' : afterScope.slice(slashIndex + 1),
        );

        const edgeKey = contentTextContract.parse(
          `${consumerPkgName}|${sourcePackageName}|${String(barrel)}`,
        );

        if (!edgeFileMap.has(edgeKey)) {
          edgeFileMap.set(edgeKey, new Set<AbsoluteFilePath>());
          edgeMeta.set(edgeKey, { consumerPackage: consumerPkg, sourcePackage, barrel });
        }

        edgeFileMap.get(edgeKey)?.add(filePath);
      }
    }
  }

  const edges: ImportEdge[] = [];
  for (const [edgeKey, fileSet] of edgeFileMap) {
    const meta = edgeMeta.get(edgeKey);
    if (meta === undefined) {
      continue;
    }
    edges.push(
      importEdgeContract.parse({
        consumerPackage: meta.consumerPackage,
        sourcePackage: meta.sourcePackage,
        barrel: meta.barrel,
        importCount: fileSet.size,
      }),
    );
  }

  return edges;
};
