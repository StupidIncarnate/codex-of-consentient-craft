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
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';

export const packageDiscoverBroker = ({
  dungeonmasterRoot,
}: {
  dungeonmasterRoot: FilePath;
}): { packageName: PackageName; installPath: FilePath }[] => {
  const packagesDir = pathJoinAdapter({ paths: [dungeonmasterRoot, 'packages'] });

  const packageDirs = fsReaddirAdapter({ dirPath: packagesDir });

  const packagesWithInstallers: { packageName: PackageName; installPath: FilePath }[] = [];

  for (const dir of packageDirs) {
    const installPath = pathJoinAdapter({
      paths: [packagesDir, dir, 'dist', 'startup', 'start-install.js'],
    });

    if (fsExistsSyncAdapter({ filePath: installPath })) {
      const packageName = packageNameContract.parse(`@dungeonmaster/${dir}`);
      packagesWithInstallers.push({
        packageName,
        installPath: filePathContract.parse(installPath),
      });
    }
  }

  return packagesWithInstallers;
};
