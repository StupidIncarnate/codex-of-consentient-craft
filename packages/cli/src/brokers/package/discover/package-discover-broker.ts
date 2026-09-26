/**
 * PURPOSE: Discovers all packages with install scripts in the dungeonmaster monorepo
 *
 * USAGE:
 * const packages = packageDiscoverBroker({
 *   dungeonmasterRoot: filePathContract.parse('/home/user/projects/dungeonmaster')
 * });
 * // Returns array of {packageName, installPath} for each package with start-install.js
 */

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { pathJoinAdapter, fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { packageNameContract, filePathContract } from '@dungeonmaster/shared/contracts';
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
  const packagesDir = pathJoinAdapter({ paths: [dungeonmasterRoot, 'packages'] });
  const topLevelDirs = fsReaddirAdapter({ dirPath: packagesDir });

  const candidates: { relativeDir: FileName[]; packageDirName: FileName }[] = [];

  for (const dir of topLevelDirs) {
    if (!dir.startsWith(GROUP_FOLDER_PREFIX)) {
      candidates.push({ relativeDir: [dir], packageDirName: dir });
      continue;
    }

    const groupDir = pathJoinAdapter({ paths: [packagesDir, dir] });
    for (const child of fsReaddirAdapter({ dirPath: groupDir })) {
      candidates.push({ relativeDir: [dir, child], packageDirName: child });
    }
  }

  const packagesWithInstallers: { packageName: PackageName; installPath: FilePath }[] = [];

  for (const { relativeDir, packageDirName } of candidates) {
    // Check standard path: dist/startup/start-install.js
    const standardPath = pathJoinAdapter({
      paths: [packagesDir, ...relativeDir, 'dist', 'startup', 'start-install.js'],
    });

    // Check alternate path: dist/src/startup/start-install.js (for packages with rootDir: ".")
    const alternatePath = pathJoinAdapter({
      paths: [packagesDir, ...relativeDir, 'dist', 'src', 'startup', 'start-install.js'],
    });

    const installPath = fsExistsSyncAdapter({ filePath: standardPath })
      ? standardPath
      : fsExistsSyncAdapter({ filePath: alternatePath })
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
