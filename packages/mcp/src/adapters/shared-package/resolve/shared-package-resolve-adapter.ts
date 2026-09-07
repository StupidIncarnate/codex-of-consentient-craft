/**
 * PURPOSE: Resolves the path to @dungeonmaster/shared package root using require.resolve
 *
 * USAGE:
 * const sharedPath = sharedPackageResolveAdapter();
 * // Returns PathSegment to shared package root or null if not found
 */
import { dirname } from 'path';
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import { findSharedPackageRootLayerAdapter } from './find-shared-package-root-layer-adapter';

export const sharedPackageResolveAdapter = (): PathSegment | null => {
  try {
    // Resolve a known subpath export (package has no default export). This resolves to
    // dist/contracts.js under normal require/import resolution, and to contracts.ts AT THE
    // PACKAGE ROOT under --conditions=source (tsx) — the two land at different depths, so walk
    // up to the nearest ancestor package.json rather than assume a fixed depth.
    const resolvedPath = require.resolve('@dungeonmaster/shared/contracts');

    return findSharedPackageRootLayerAdapter({ startDir: dirname(resolvedPath) });
  } catch {
    // Package not found or other error - fail silently
    return null;
  }
};
