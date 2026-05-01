/**
 * PURPOSE: Scans all monorepo source files to produce ImportEdge records representing
 * cross-package barrel import relationships beyond direct adapter wrappers. Aggregates
 * by (consumerPackage, sourcePackage, barrel) triple, counting distinct consumer files.
 *
 * USAGE:
 * const edges = importEdgesLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns ImportEdge[] grouped by (consumerPackage, sourcePackage, barrel)
 *
 * WHEN-TO-USE: Building the import-edges section of the project-map EDGES footer
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (this is a regex v1 heuristic)
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
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

const PACKAGES_REL = 'packages';
const DUNGEONMASTER_SCOPE = '@dungeonmaster/';

export const importEdgesLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): ImportEdge[] => {
  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);

  // Step 1: collect known package names
  const packageEntries = safeReaddirLayerBroker({ dirPath: packagesDir });
  const knownPackageNames = new Set<ContentText>();
  for (const entry of packageEntries) {
    if (entry.isDirectory() && entry.name !== 'CLAUDE.md') {
      knownPackageNames.add(contentTextContract.parse(entry.name));
    }
  }

  // aggregation map: key = "<consumerPkg>|<sourcePkg>|<barrel>" as ContentText
  // value: Set of distinct consumer file paths (as AbsoluteFilePath strings) that imported this edge
  const edgeFileMap = new Map<ContentText, Set<AbsoluteFilePath>>();
  const edgeMeta = new Map<
    ContentText,
    { consumerPackage: ContentText; sourcePackage: ContentText; barrel: ContentText }
  >();

  // Step 2: for each consumer package, list all TS source files and parse imports
  for (const consumerPkg of knownPackageNames) {
    const consumerPkgName = String(consumerPkg);
    const pkgSrcDir = absoluteFilePathContract.parse(
      `${root}/${PACKAGES_REL}/${consumerPkgName}/src`,
    );

    const allFiles = listTsFilesLayerBroker({ dirPath: pkgSrcDir });

    for (const filePath of allFiles) {
      const source = readFileLayerBroker({ filePath });
      if (source === undefined) {
        continue;
      }

      const importPaths = importStatementsExtractTransformer({ source });

      for (const importPath of importPaths) {
        const importStr = String(importPath);

        // Only process @dungeonmaster/* imports
        if (!importStr.startsWith(DUNGEONMASTER_SCOPE)) {
          continue;
        }

        // Extract source package name: '@dungeonmaster/shared/contracts' → 'shared'
        const afterScope = importStr.slice(DUNGEONMASTER_SCOPE.length);
        const slashIndex = afterScope.indexOf('/');
        const sourcePackageName = slashIndex === -1 ? afterScope : afterScope.slice(0, slashIndex);

        // Only process imports from known monorepo packages
        const sourcePackage = contentTextContract.parse(sourcePackageName);
        const isKnownPackage = [...knownPackageNames].some((p) => String(p) === sourcePackageName);
        if (!isKnownPackage) {
          continue;
        }

        // Skip self-imports
        if (sourcePackageName === consumerPkgName) {
          continue;
        }

        // Skip adapter-wrapper files (covered by direct-call-edges-layer-broker).
        // Heuristic: packages/<consumer>/src/adapters/<sourcePkg>/...
        const adapterWrapperPrefix = `${root}/${PACKAGES_REL}/${consumerPkgName}/src/adapters/${sourcePackageName}/`;
        if (String(filePath).startsWith(adapterWrapperPrefix)) {
          continue;
        }

        // Extract barrel subpath: '@dungeonmaster/shared/contracts' → 'contracts', '@dungeonmaster/shared' → ''
        const barrel = contentTextContract.parse(
          slashIndex === -1 ? '' : afterScope.slice(slashIndex + 1),
        );

        const edgeKey = contentTextContract.parse(
          `${consumerPkgName}|${sourcePackageName}|${String(barrel)}`,
        );

        if (!edgeFileMap.has(edgeKey)) {
          edgeFileMap.set(edgeKey, new Set<AbsoluteFilePath>());
          edgeMeta.set(edgeKey, {
            consumerPackage: consumerPkg,
            sourcePackage,
            barrel,
          });
        }

        edgeFileMap.get(edgeKey)?.add(filePath);
      }
    }
  }

  // Step 3: convert map to ImportEdge[]
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
