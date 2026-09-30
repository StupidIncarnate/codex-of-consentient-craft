/**
 * PURPOSE: Wraps `resolveSpecifierLayerBroker` with a cache keyed on the containing file plus the
 * specifier text, shared for the lifetime of one top-level `walkGatewayCrossingsLayerBroker` call.
 * Without it, a specifier several sibling files resolve identically (a workspace package's own
 * barrel, a shared utility import reached through a diamond) is re-resolved — and its target file
 * re-read from disk — once per occurrence rather than once per distinct (containingFilePath,
 * specifier) pair.
 *
 * USAGE:
 * await resolveSpecifierCachedLayerBroker({
 *   specifier: ModuleSpecifierStub({value: './helper'}),
 *   containingFilePath: filePathContract.parse('/repo/entry.ts'),
 *   knownPackages: [],
 *   resolveCache: new Map(),
 * });
 * // Returns: { filePath, content } or undefined, same shape as resolveSpecifierLayerBroker
 */

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { resolveSpecifierLayerBroker } from './resolve-specifier-layer-broker';

export type ResolveSpecifierCache = Map<
  string,
  Promise<{ filePath: string; content: string } | undefined>
>;

export const resolveSpecifierCachedLayerBroker = async ({
  specifier,
  containingFilePath,
  knownPackages,
  resolveCache,
}: {
  specifier: string;
  containingFilePath: string;
  knownPackages: readonly ProjectFolder[];
  resolveCache: ResolveSpecifierCache;
}): Promise<{ filePath: string; content: string } | undefined> => {
  const cacheKey = `${containingFilePath}\u0000${specifier}`;
  const cached = resolveCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const resolved = resolveSpecifierLayerBroker({ specifier, containingFilePath, knownPackages });
  resolveCache.set(cacheKey, resolved);
  return resolved;
};
