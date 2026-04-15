/**
 * PURPOSE: Resolves the path to @dungeonmaster/shared package root using require.resolve
 *
 * USAGE:
 * const sharedPath = sharedPackageResolveAdapter();
 * // Returns PathSegment to shared package root or null if not found
 */
import { dirname } from 'path';
import { existsSync } from 'fs';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const sharedPackageResolveAdapter = (): PathSegment | null => {
  try {
    // Resolve a known subpath export (package has no default export)
    // @dungeonmaster/shared/contracts resolves to dist/contracts.js
    const resolvedPath = require.resolve('@dungeonmaster/shared/contracts');

    // Navigate up from dist/contracts.js to package root
    // The structure is: @dungeonmaster/shared/dist/contracts.js
    const packageRoot = dirname(dirname(resolvedPath));

    // Verify package root exists
    if (!existsSync(packageRoot)) {
      return null;
    }

    return pathSegmentContract.parse(packageRoot);
  } catch {
    // Package not found or other error - fail silently
    return null;
  }
};
