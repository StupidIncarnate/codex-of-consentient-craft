/**
 * PURPOSE: Resolves the path to @dungeonmaster/shared source directory using require.resolve
 *
 * USAGE:
 * const sharedPath = sharedPackageResolveAdapter();
 * // Returns AbsoluteFilePath to shared/src or null if not found
 */
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const sharedPackageResolveAdapter = (): AbsoluteFilePath | null => {
  try {
    // Resolve a known subpath export (package has no default export)
    // @dungeonmaster/shared/contracts resolves to dist/contracts.js
    const resolvedPath = require.resolve('@dungeonmaster/shared/contracts');

    // Navigate up from dist/contracts.js to package root, then to src
    // The structure is: @dungeonmaster/shared/dist/contracts.js
    // We need to get to: @dungeonmaster/shared/src
    const packageRoot = dirname(dirname(resolvedPath));
    const srcPath = join(packageRoot, 'src');

    // Verify src directory exists
    if (!existsSync(srcPath)) {
      return null;
    }

    return absoluteFilePathContract.parse(srcPath);
  } catch {
    // Package not found or other error - fail silently
    return null;
  }
};
