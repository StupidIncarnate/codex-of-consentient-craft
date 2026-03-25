/**
 * PURPOSE: Resolves the path to @dungeonmaster/shared package root using require.resolve
 *
 * USAGE:
 * const sharedPath = sharedPackageResolveAdapter();
 * // Returns AbsoluteFilePath to shared package root or null if not found
 */
import { dirname } from 'path';
import { existsSync } from 'fs';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const sharedPackageResolveAdapter = (): AbsoluteFilePath | null => {
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

    return absoluteFilePathContract.parse(packageRoot);
  } catch {
    // Package not found or other error - fail silently
    return null;
  }
};
