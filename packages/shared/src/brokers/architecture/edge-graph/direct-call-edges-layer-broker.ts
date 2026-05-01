/**
 * PURPOSE: Scans all monorepo packages for cross-package adapter folders to produce
 * DirectCallEdge records. A subfolder `packages/<P>/src/adapters/<Q>/` where `<Q>`
 * matches another known package name indicates that package P wraps package Q.
 * Method names are extracted via regex from adapter file bodies.
 *
 * USAGE:
 * const edges = directCallEdgesLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns DirectCallEdge[] with callerPackage, calleePackage, adapterFiles, methodNames
 *
 * WHEN-TO-USE: Building the direct-call-edges section of the project-map EDGES footer
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (this is a regex v1 heuristic)
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import {
  directCallEdgeContract,
  type DirectCallEdge,
} from '../../../contracts/direct-call-edge/direct-call-edge-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { namespaceMethodCallsExtractTransformer } from '../../../transformers/namespace-method-calls-extract/namespace-method-calls-extract-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

const PACKAGES_REL = 'packages';

export const directCallEdgesLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): DirectCallEdge[] => {
  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);

  // Step 1: collect known package names by listing immediate subdirs of packages/
  const packageEntries = safeReaddirLayerBroker({ dirPath: packagesDir });
  const knownPackageNames = new Map<ContentText, true>();
  for (const entry of packageEntries) {
    if (entry.isDirectory() && entry.name !== 'CLAUDE.md') {
      knownPackageNames.set(contentTextContract.parse(entry.name), true);
    }
  }

  // aggregation map: key = "<callerPkg>|<calleePkg>"
  const edgeMap = new Map<ContentText, DirectCallEdge>();

  // Step 2: for each package, check packages/<P>/src/adapters/ for known-package subfolders
  for (const callerPkg of knownPackageNames.keys()) {
    const adaptersDir = absoluteFilePathContract.parse(
      `${root}/${PACKAGES_REL}/${String(callerPkg)}/src/adapters`,
    );

    const adapterEntries = safeReaddirLayerBroker({ dirPath: adaptersDir });

    for (const adapterEntry of adapterEntries) {
      if (!adapterEntry.isDirectory()) {
        continue;
      }

      // Only process if the subfolder name matches a known package
      const calleeName = contentTextContract.parse(adapterEntry.name);
      const isKnownPackage = knownPackageNames.has(calleeName);
      if (!isKnownPackage) {
        continue;
      }

      const edgeKey = contentTextContract.parse(`${String(callerPkg)}|${String(calleeName)}`);

      const wrapperDir = absoluteFilePathContract.parse(
        `${root}/${PACKAGES_REL}/${String(callerPkg)}/src/adapters/${String(calleeName)}`,
      );

      // Step 3: recursively list all *-adapter.ts files under this wrapper subfolder
      const adapterFiles = listTsFilesLayerBroker({ dirPath: wrapperDir }).filter((fp) => {
        const name = String(fp);
        return name.endsWith('-adapter.ts') && isNonTestFileGuard({ filePath: fp });
      });

      if (adapterFiles.length === 0) {
        continue;
      }

      // Step 4: read each adapter file and extract method names
      const existing = edgeMap.get(edgeKey);
      const entry: DirectCallEdge = existing ?? {
        callerPackage: callerPkg,
        calleePackage: calleeName,
        adapterFiles: [],
        methodNames: [],
      };

      for (const adapterFile of adapterFiles) {
        const alreadyListed = entry.adapterFiles.some((f) => String(f) === String(adapterFile));
        if (!alreadyListed) {
          entry.adapterFiles.push(adapterFile);
        }

        const source = readFileLayerBroker({ filePath: adapterFile });
        if (source === undefined) {
          continue;
        }

        const extracted = namespaceMethodCallsExtractTransformer({ source });
        for (const methodName of extracted) {
          const alreadyHave = entry.methodNames.some((m) => String(m) === String(methodName));
          if (!alreadyHave) {
            entry.methodNames.push(methodName);
          }
        }
      }

      edgeMap.set(edgeKey, entry);
    }
  }

  // Step 5: convert map to DirectCallEdge[]
  return [...edgeMap.values()].map((entry) => directCallEdgeContract.parse(entry));
};
