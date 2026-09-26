/**
 * PURPOSE: Depth-first walks one file's import graph, reporting every chain that reaches a
 * specifier belonging to a forbidden gateway package. `requestedNames` is `'all'` for a file that
 * is fully loaded (the starting file itself, or anything reached through a default/namespace
 * import) and a specific name list for a file reached through a NAMED import — which lets a `star`
 * re-export barrel (`export * from './x'`) be narrowed to only the targets that could actually
 * provide one of those names, via `barrelProvidesNameTransformer`. A `pathHistory` cycle guard
 * stops the walk from looping through a file it is already inside. Every dependency edge is handled
 * through `Array.prototype.map` rather than a `for` loop, because `no-await-in-loop` (error,
 * repo-wide) forbids the loop-statement form of awaiting each edge's own resolution.
 *
 * USAGE:
 * await walkGatewayCrossingsLayerBroker({
 *   filePath: entryFilePath, content: entryContent, requestedNames: 'all',
 *   pathHistory: [entryFilePath], chainLabels: [], knownPackages, forbiddenPackageNames: [GatewayPackageNameStub()],
 * });
 * // Returns: readonly PlatformCrossingChainHop[][] — every forbidden import chain reachable from this file
 */

import type { FilePath, FileContents } from '@dungeonmaster/shared/contracts';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { GatewayPackageName } from '../../../contracts/gateway-package-name/gateway-package-name-contract';
import type { ImportedName } from '../../../contracts/imported-name/imported-name-contract';
import {
  platformCrossingChainHopContract,
  type PlatformCrossingChainHop,
} from '../../../contracts/platform-crossing-chain-hop/platform-crossing-chain-hop-contract';
import { isImplementationSourceFileGuard } from '../../../guards/is-implementation-source-file/is-implementation-source-file-guard';
import { specifierMatchesPackageGuard } from '../../../guards/specifier-matches-package/specifier-matches-package-guard';
import { barrelProvidesNameTransformer } from '../../../transformers/barrel-provides-name/barrel-provides-name-transformer';
import { intersectImportedNamesTransformer } from '../../../transformers/intersect-imported-names/intersect-imported-names-transformer';
import { typescriptModuleShapeAdapter } from '../../../adapters/typescript/module-shape/typescript-module-shape-adapter';
import { resolveSpecifierLayerBroker } from './resolve-specifier-layer-broker';

export const walkGatewayCrossingsLayerBroker = async ({
  filePath,
  content,
  requestedNames,
  pathHistory,
  chainLabels,
  knownPackages,
  forbiddenPackageNames,
}: {
  filePath: FilePath;
  content: FileContents;
  requestedNames: 'all' | readonly ImportedName[];
  pathHistory: readonly FilePath[];
  chainLabels: readonly PlatformCrossingChainHop[];
  knownPackages: readonly ProjectFolder[];
  forbiddenPackageNames: readonly GatewayPackageName[];
}): Promise<readonly PlatformCrossingChainHop[][]> => {
  const moduleShape = typescriptModuleShapeAdapter({ sourceText: content, fileName: filePath });

  // Narrowing by name is only meaningful while walking through a PURE re-export barrel — each of
  // its lines is really a separate module, so only the ones providing a requested name matter. The
  // moment a file declares any export of its own, it is a real implementation file: every one of
  // ITS OWN top-level imports executes together when it loads, regardless of which of its exports
  // an ancestor asked for. Downgrading to 'all' here — rather than threading the caller's narrower
  // list into this file's own dependency loop — is what keeps a real crossing from being dropped
  // just because an ancestor barrel only asked for one of several names this file exports.
  const effectiveRequestedNames = moduleShape.localExportNames.length > 0 ? 'all' : requestedNames;

  const perDependencyChains = await Promise.all(
    moduleShape.dependencies.map(
      async (dependency): Promise<readonly PlatformCrossingChainHop[][]> => {
        const specifierHop = platformCrossingChainHopContract.parse(dependency.specifier);
        const isCrossing = forbiddenPackageNames.some((packageName) =>
          specifierMatchesPackageGuard({ specifier: dependency.specifier, packageName }),
        );

        if (dependency.kind === 'named') {
          const relevantNames = intersectImportedNamesTransformer({
            names: dependency.importedNames,
            requestedNames: effectiveRequestedNames,
          });
          if (relevantNames.length === 0) {
            return [];
          }
          if (isCrossing) {
            return [[...chainLabels, specifierHop]];
          }

          const resolved = await resolveSpecifierLayerBroker({
            specifier: dependency.specifier,
            containingFilePath: filePath,
            knownPackages,
          });
          if (
            resolved === undefined ||
            !isImplementationSourceFileGuard({ filePath: resolved.filePath }) ||
            pathHistory.includes(resolved.filePath)
          ) {
            return [];
          }

          return walkGatewayCrossingsLayerBroker({
            filePath: resolved.filePath,
            content: resolved.content,
            requestedNames: relevantNames,
            pathHistory: [...pathHistory, filePath],
            chainLabels: [...chainLabels, specifierHop],
            knownPackages,
            forbiddenPackageNames,
          });
        }

        if (isCrossing) {
          return [[...chainLabels, specifierHop]];
        }

        const resolved = await resolveSpecifierLayerBroker({
          specifier: dependency.specifier,
          containingFilePath: filePath,
          knownPackages,
        });
        if (
          resolved === undefined ||
          !isImplementationSourceFileGuard({ filePath: resolved.filePath }) ||
          pathHistory.includes(resolved.filePath)
        ) {
          return [];
        }

        if (dependency.kind === 'opaque') {
          return walkGatewayCrossingsLayerBroker({
            filePath: resolved.filePath,
            content: resolved.content,
            requestedNames: 'all',
            pathHistory: [...pathHistory, filePath],
            chainLabels: [...chainLabels, specifierHop],
            knownPackages,
            forbiddenPackageNames,
          });
        }

        // `dependency.kind === 'star'`: narrow to the requested names the target can still provide.
        const targetShape = typescriptModuleShapeAdapter({
          sourceText: resolved.content,
          fileName: resolved.filePath,
        });
        const childRequestedNames =
          effectiveRequestedNames === 'all'
            ? 'all'
            : effectiveRequestedNames.filter(
                (name) =>
                  barrelProvidesNameTransformer({ moduleShape: targetShape, name }) !== 'no',
              );

        if (childRequestedNames !== 'all' && childRequestedNames.length === 0) {
          return [];
        }

        return walkGatewayCrossingsLayerBroker({
          filePath: resolved.filePath,
          content: resolved.content,
          requestedNames: childRequestedNames,
          pathHistory: [...pathHistory, filePath],
          chainLabels: [...chainLabels, specifierHop],
          knownPackages,
          forbiddenPackageNames,
        });
      },
    ),
  );

  return perDependencyChains.flat();
};
