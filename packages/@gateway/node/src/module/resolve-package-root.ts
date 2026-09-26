/**
 * PURPOSE: Locates an installed npm package's root directory — the nearest ancestor holding a
 * `package.json` above the package's own resolved entry file. Reach for this over a bare
 * `require.resolve` whenever the goal is finding WHERE a package lives on disk rather than
 * loading it, since a package's main entry can sit several directories below its root (a
 * `dist/src/index.js`) or exactly at it, and the depth is not guessable in advance. `startDir`
 * is an internal recursion parameter, never passed by a first-time caller — a single exported
 * function recurses through itself rather than delegating to an unexported helper.
 *
 * USAGE:
 * resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });
 * // Returns the absolute path to @dungeonmaster/shared's package root, or null if not installed
 */

import { dirname } from 'path';

export const resolvePackageRoot = ({
  specifier,
  startDir,
}: {
  specifier: string;
  startDir?: string;
}): string | null => {
  if (startDir !== undefined) {
    try {
      require.resolve(`${startDir}/package.json`);
      return startDir;
    } catch {
      const parentDir = dirname(startDir);
      if (parentDir === startDir) {
        return null;
      }
      return resolvePackageRoot({ specifier, startDir: parentDir });
    }
  }

  try {
    const resolvedPath = require.resolve(specifier);
    return resolvePackageRoot({ specifier, startDir: dirname(resolvedPath) });
  } catch {
    return null;
  }
};
