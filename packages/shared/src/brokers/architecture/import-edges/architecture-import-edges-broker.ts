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

import {
  importEdgeContract,
  type ImportEdge,
} from '../../../contracts/import-edge/import-edge-contract';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { readSourceLayerBroker } from './read-source-layer-broker';
import { listTsFilesRecursiveLayerBroker } from './list-ts-files-recursive-layer-broker';

const PACKAGES_REL = 'packages';
const DUNGEONMASTER_SCOPE = '@dungeonmaster/';

export const architectureImportEdgesBroker = ({
  projectRoot,
}: {
  projectRoot: string;
}): ImportEdge[] => {
  const root = projectRoot;
  const packagesDir = `${root}/${PACKAGES_REL}`;

  const packageEntries = safeReaddirLayerBroker({ dirPath: packagesDir });
  if (packageEntries.length === 0) {
    return [];
  }

  const knownPackageNames = new Set<string>();
  for (const entry of packageEntries) {
    if (entry.kind === 'directory' && entry.name !== locationsStatics.repoRoot.claudeMd) {
      knownPackageNames.add(entry.name);
    }
  }

  const edgeFileMap = new Map<string, Set<string>>();
  const edgeMeta = new Map<
    string,
    { consumerPackage: string; sourcePackage: string; barrel: string }
  >();

  for (const consumerPkg of knownPackageNames) {
    const consumerPkgName = consumerPkg;
    const pkgSrcDir = `${root}/${PACKAGES_REL}/${consumerPkgName}/src`;

    const allFiles = listTsFilesRecursiveLayerBroker({ dirPath: pkgSrcDir });

    for (const filePath of allFiles) {
      const source = readSourceLayerBroker({ filePath });
      if (source === undefined) {
        continue;
      }

      const importPaths = importStatementsExtractTransformer({ source });

      for (const importPath of importPaths) {
        const importStr = importPath;

        if (!importStr.startsWith(DUNGEONMASTER_SCOPE)) {
          continue;
        }

        const afterScope = importStr.slice(DUNGEONMASTER_SCOPE.length);
        const slashIndex = afterScope.indexOf('/');
        const sourcePackageName = slashIndex === -1 ? afterScope : afterScope.slice(0, slashIndex);

        const isKnownPackage = [...knownPackageNames].some((p) => p === sourcePackageName);
        if (!isKnownPackage) {
          continue;
        }

        if (sourcePackageName === consumerPkgName) {
          continue;
        }

        const adapterWrapperPrefix = `${root}/${PACKAGES_REL}/${consumerPkgName}/src/adapters/${sourcePackageName}/`;
        if (filePath.startsWith(adapterWrapperPrefix)) {
          continue;
        }

        const sourcePackage = sourcePackageName;
        const barrel = slashIndex === -1 ? '' : afterScope.slice(slashIndex + 1);

        const edgeKey = `${consumerPkgName}|${sourcePackageName}|${barrel}`;

        if (!edgeFileMap.has(edgeKey)) {
          edgeFileMap.set(edgeKey, new Set<string>());
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
