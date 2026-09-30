/**
 * PURPOSE: Depth-first walks one file's import graph, reporting the first chain reaching a specifier
 * belonging to a forbidden gateway package. `requestedNames` is `'all'` for a file that is fully
 * loaded (the starting file itself, or anything reached through a default/namespace import) and a
 * specific name list for a file reached through a NAMED import — which lets a `star` re-export
 * barrel (`export * from './x'`) be narrowed to only the targets that could actually provide one of
 * those names, via `barrelProvidesNameTransformer`. `pathHistory` guards a real cycle (a file
 * reachable from itself along the current path, checked before any cache lookup); `memo` guards a
 * DIAMOND (two different paths reaching the same file). Without it, ordinary fan-in (a shared
 * barrel, a common utility several widgets import) re-walks that shared subtree once per incoming
 * path, so the recursion's cost grows with the number of PATHS through the graph rather than the
 * number of FILES in it — exponential within one entry file's own walk, and multiplied again across
 * every entry file `platformCrossingCheckBroker` starts one from, which is how this OOM'd on the
 * real repo. `moduleShapeCache`/`resolveCache` (parsing, specifier resolution) carry no such
 * concern — both are pure functions of a file's own content — so the caller shares one pair across
 * every entry file's walk for the whole run. `memo` is safe to share the same way, EVEN THOUGH a
 * node memoized while some ancestor sits on the CALLER's `pathHistory` may have a real edge back to
 * that ancestor cut: the ancestor's own remaining dependencies are still walked as an independent
 * sibling of that cut edge, in the SAME recursion that produced the cut, so nothing the ancestor's
 * own walk could report is lost — and because `platformCrossingCheckBroker` starts a fresh
 * top-level walk from every production file in every package (not only from files nothing else
 * imports), every file that could be such an ancestor also gets its own uncut, from-scratch
 * computation somewhere in the run. The one caveat is per platform, not per entry file: `memo` is
 * split by which packages are forbidden (a browser-platform walk and a node-platform walk disagree
 * about what counts as a crossing), so `platformCrossingCheckBroker` keeps one memo per platform
 * rather than one for the whole run. Every dependency edge is handled through `Array.prototype.map`
 * rather than a `for` loop, because `no-await-in-loop` (error, repo-wide) forbids the loop-statement
 * form of awaiting each edge's own resolution. Every dependency's specifier runs through
 * `gatewaySpecifierCanonicalizeTransformer` before it is matched against `forbiddenPackageNames` or
 * handed to `resolveSpecifierCachedLayerBroker`, so a `#gateway/<folder>/<sub>` import is treated as
 * the real package specifier it names — one canonicalization, reused for both the crossing check and
 * the reported chain hop, rather than teaching each of those two a separate gateway-aware match.
 *
 * USAGE:
 * await walkGatewayCrossingsLayerBroker({
 *   filePath: entryFilePath, content: entryContent, requestedNames: 'all',
 *   pathHistory: [entryFilePath], chainLabels: [], knownPackages, forbiddenPackageNames: [GatewayPackageNameStub()],
 * });
 * // Returns: readonly PlatformCrossingChainHop[][] — the first chain reached to each forbidden import
 */


import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { GatewayPackageName } from '../../../contracts/gateway-package-name/gateway-package-name-contract';
import type { ImportedName } from '../../../contracts/imported-name/imported-name-contract';
import {
  platformCrossingChainHopContract,
  type PlatformCrossingChainHop,
} from '../../../contracts/platform-crossing-chain-hop/platform-crossing-chain-hop-contract';
import type { TypescriptModuleShape } from '../../../contracts/typescript-module-shape/typescript-module-shape-contract';
import { isImplementationSourceFileGuard } from '../../../guards/is-implementation-source-file/is-implementation-source-file-guard';
import { specifierMatchesPackageGuard } from '../../../guards/specifier-matches-package/specifier-matches-package-guard';
import { gatewaySpecifierCanonicalizeTransformer } from '../../../transformers/gateway-specifier-canonicalize/gateway-specifier-canonicalize-transformer';
import { barrelProvidesNameTransformer } from '../../../transformers/barrel-provides-name/barrel-provides-name-transformer';
import { intersectImportedNamesTransformer } from '../../../transformers/intersect-imported-names/intersect-imported-names-transformer';
import { typescriptModuleShapeTransformer } from '../../../transformers/typescript-module-shape/typescript-module-shape-transformer';
import {
  resolveSpecifierCachedLayerBroker,
  type ResolveSpecifierCache,
} from './resolve-specifier-cached-layer-broker';

export type WalkGatewayCrossingsMemo = Map<
  string,
  Promise<readonly PlatformCrossingChainHop[][]>
>;
export type ModuleShapeCache = Map<string, TypescriptModuleShape>;
export type { ResolveSpecifierCache };

export const walkGatewayCrossingsLayerBroker = async ({
  filePath,
  content,
  requestedNames,
  pathHistory,
  chainLabels,
  knownPackages,
  forbiddenPackageNames,
  memo = new Map(),
  moduleShapeCache = new Map(),
  resolveCache = new Map(),
}: {
  filePath: string;
  content: string;
  requestedNames: 'all' | readonly ImportedName[];
  pathHistory: readonly string[];
  chainLabels: readonly PlatformCrossingChainHop[];
  knownPackages: readonly ProjectFolder[];
  forbiddenPackageNames: readonly GatewayPackageName[];
  memo?: WalkGatewayCrossingsMemo;
  moduleShapeCache?: ModuleShapeCache;
  resolveCache?: ResolveSpecifierCache;
}): Promise<readonly PlatformCrossingChainHop[][]> => {
  const cachedShape = moduleShapeCache.get(filePath);
  const moduleShape =
    cachedShape ?? typescriptModuleShapeTransformer({ sourceText: content, fileName: filePath });
  if (cachedShape === undefined) {
    moduleShapeCache.set(filePath, moduleShape);
  }

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
        const canonicalSpecifier = gatewaySpecifierCanonicalizeTransformer({
          specifier: dependency.specifier,
          knownPackages,
        });
        const specifierHop = platformCrossingChainHopContract.parse(canonicalSpecifier);
        const isCrossing = forbiddenPackageNames.some((packageName) =>
          specifierMatchesPackageGuard({ specifier: canonicalSpecifier, packageName }),
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
            return [[specifierHop]];
          }

          const resolved = await resolveSpecifierCachedLayerBroker({
            specifier: canonicalSpecifier,
            containingFilePath: filePath,
            knownPackages,
            resolveCache,
          });
          if (
            resolved === undefined ||
            !isImplementationSourceFileGuard({ filePath: resolved.filePath }) ||
            pathHistory.includes(resolved.filePath)
          ) {
            return [];
          }

          const namesKey = [...new Set(relevantNames)].sort().join('\u0001');
          const memoKey = `${resolved.filePath}\u0000${namesKey}`;
          const cachedWalk = memo.get(memoKey);
          const childChainsPromise =
            cachedWalk ??
            walkGatewayCrossingsLayerBroker({
              filePath: resolved.filePath,
              content: resolved.content,
              requestedNames: relevantNames,
              pathHistory: [...pathHistory, filePath],
              chainLabels: [],
              knownPackages,
              forbiddenPackageNames,
              memo,
              moduleShapeCache,
              resolveCache,
            });
          if (cachedWalk === undefined) {
            memo.set(memoKey, childChainsPromise);
          }
          const childChains = await childChainsPromise;
          return childChains.map((chain) => [specifierHop, ...chain]);
        }

        if (isCrossing) {
          return [[specifierHop]];
        }

        const resolved = await resolveSpecifierCachedLayerBroker({
          specifier: canonicalSpecifier,
          containingFilePath: filePath,
          knownPackages,
          resolveCache,
        });
        if (
          resolved === undefined ||
          !isImplementationSourceFileGuard({ filePath: resolved.filePath }) ||
          pathHistory.includes(resolved.filePath)
        ) {
          return [];
        }

        if (dependency.kind === 'opaque') {
          const memoKey = `${resolved.filePath}\u0000all`;
          const cachedWalk = memo.get(memoKey);
          const childChainsPromise =
            cachedWalk ??
            walkGatewayCrossingsLayerBroker({
              filePath: resolved.filePath,
              content: resolved.content,
              requestedNames: 'all',
              pathHistory: [...pathHistory, filePath],
              chainLabels: [],
              knownPackages,
              forbiddenPackageNames,
              memo,
              moduleShapeCache,
              resolveCache,
            });
          if (cachedWalk === undefined) {
            memo.set(memoKey, childChainsPromise);
          }
          const childChains = await childChainsPromise;
          return childChains.map((chain) => [specifierHop, ...chain]);
        }

        // `dependency.kind === 'star'`: narrow to the requested names the target can still provide.
        const cachedTargetShape = moduleShapeCache.get(resolved.filePath);
        const targetShape =
          cachedTargetShape ??
          typescriptModuleShapeTransformer({
            sourceText: resolved.content,
            fileName: resolved.filePath,
          });
        if (cachedTargetShape === undefined) {
          moduleShapeCache.set(resolved.filePath, targetShape);
        }

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

        const namesKey =
          childRequestedNames === 'all'
            ? 'all'
            : [...new Set(childRequestedNames)].sort().join('\u0001');
        const memoKey = `${resolved.filePath}\u0000${namesKey}`;
        const cachedWalk = memo.get(memoKey);
        const childChainsPromise =
          cachedWalk ??
          walkGatewayCrossingsLayerBroker({
            filePath: resolved.filePath,
            content: resolved.content,
            requestedNames: childRequestedNames,
            pathHistory: [...pathHistory, filePath],
            chainLabels: [],
            knownPackages,
            forbiddenPackageNames,
            memo,
            moduleShapeCache,
            resolveCache,
          });
        if (cachedWalk === undefined) {
          memo.set(memoKey, childChainsPromise);
        }
        const childChains = await childChainsPromise;
        return childChains.map((chain) => [specifierHop, ...chain]);
      },
    ),
  );

  const localChains = perDependencyChains.flat();
  return chainLabels.length === 0
    ? localChains
    : localChains.map((chain) => [...chainLabels, ...chain]);
};
