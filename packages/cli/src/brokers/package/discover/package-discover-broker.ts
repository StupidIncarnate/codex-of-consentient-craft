/**
 * PURPOSE: Discovers all packages with install scripts in the dungeonmaster monorepo
 *
 * USAGE:
 * const packages = packageDiscoverBroker({
 *   dungeonmasterRoot: filePathContract.parse('/home/user/projects/dungeonmaster')
 * });
 * // Returns array of {packageName, installPath} for each package with start-install.js
 */

import { join } from '#gateway/node/path';
import { existsSync, readdirSync } from '#gateway/node/fs';
import {
  packageNameContract,
  filePathContract,
  fileNameContract,
} from '@dungeonmaster/shared/contracts';
import type { FilePath, PackageName, FileName } from '@dungeonmaster/shared/contracts';

// A directory directly under `packages/` whose name starts with `@` is a scope/group folder, not
// a package itself — the same nesting `node_modules/@scope/name` uses. Its children are the real
// packages, found on disk at `packages/<group>/<child>` but still named `@dungeonmaster/<child>`.
const GROUP_FOLDER_PREFIX = '@';

export const packageDiscoverBroker = ({
  dungeonmasterRoot,
}: {
  dungeonmasterRoot: FilePath;
}): { packageName: PackageName; installPath: FilePath }[] => {
  const monorepoPackagesDir = filePathContract.parse(join(dungeonmasterRoot, 'packages'));
  // A published install has no `packages/` folder to find: `cli-entry.ts` computes
  // `dungeonmasterRoot` as four directories above the running bin, which lands on the monorepo
  // root ONLY in this repo and its worktrees. In an installed consumer (local `node_modules`, or
  // a global `npm root -g`) that same walk lands on `node_modules` itself, one level above
  // `@dungeonmaster/<name>` directly — there is no extra `packages` segment to join. Falling back
  // to `dungeonmasterRoot` itself reuses the SAME `@scope` group-folder walk below for both
  // shapes: `node_modules/@dungeonmaster` is exactly a "`@`-prefixed group folder" of the kind
  // `packages/@gateway` already is.
  const packagesDir = existsSync(monorepoPackagesDir) ? monorepoPackagesDir : dungeonmasterRoot;
  const topLevelDirs = readdirSync(packagesDir).map((dir) => fileNameContract.parse(dir));

  const candidates: { relativeDir: FileName[]; packageDirName: FileName }[] = [];

  for (const dir of topLevelDirs) {
    if (!dir.startsWith(GROUP_FOLDER_PREFIX)) {
      candidates.push({ relativeDir: [dir], packageDirName: dir });
      continue;
    }

    const groupDir = join(packagesDir, dir);
    for (const child of readdirSync(groupDir).map((entry) => fileNameContract.parse(entry))) {
      candidates.push({ relativeDir: [dir, child], packageDirName: child });
    }
  }

  const packagesWithInstallers: { packageName: PackageName; installPath: FilePath }[] = [];

  for (const { relativeDir, packageDirName } of candidates) {
    // Check standard path: dist/startup/start-install.js
    const standardPath = join(packagesDir, ...relativeDir, 'dist', 'startup', 'start-install.js');

    // Check alternate path: dist/src/startup/start-install.js (for packages with rootDir: ".")
    const alternatePath = join(
      packagesDir,
      ...relativeDir,
      'dist',
      'src',
      'startup',
      'start-install.js',
    );

    const installPath = existsSync(standardPath)
      ? standardPath
      : existsSync(alternatePath)
        ? alternatePath
        : null;

    if (installPath) {
      const packageName = packageNameContract.parse(`@dungeonmaster/${packageDirName}`);
      packagesWithInstallers.push({
        packageName,
        installPath: filePathContract.parse(installPath),
      });
    }
  }

  return packagesWithInstallers;
};
