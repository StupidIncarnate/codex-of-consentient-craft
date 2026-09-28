/**
 * PURPOSE: Discovers all packages with install scripts in the dungeonmaster monorepo. Also reports
 * each package's OPTIONAL `start-install-finalize.js` — a sibling of `start-install.js` in the same
 * `dist/startup/` (or `dist/src/startup/`) directory — so the CLI orchestration layer's "after all
 * installs" pass (DEF-99) knows, per package, whether one exists without importing anything.
 *
 * USAGE:
 * const packages = packageDiscoverBroker({
 *   dungeonmasterRoot: filePathContract.parse('/home/user/projects/dungeonmaster')
 * });
 * // Returns array of {packageName, installPath, finalizeInstallPath} for each package with
 * // start-install.js; finalizeInstallPath is null when that package has no finalize step
 */

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { pathJoinAdapter, fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { packageNameContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';

const INSTALL_FINALIZE_FILENAME = 'start-install-finalize.js';

export const packageDiscoverBroker = ({
  dungeonmasterRoot,
}: {
  dungeonmasterRoot: FilePath;
}): { packageName: PackageName; installPath: FilePath; finalizeInstallPath: FilePath | null }[] => {
  const packagesDir = pathJoinAdapter({ paths: [dungeonmasterRoot, 'packages'] });

  const packageDirs = fsReaddirAdapter({ dirPath: packagesDir });

  const packagesWithInstallers: {
    packageName: PackageName;
    installPath: FilePath;
    finalizeInstallPath: FilePath | null;
  }[] = [];

  for (const dir of packageDirs) {
    // Check standard path: dist/startup/start-install.js
    const standardPath = pathJoinAdapter({
      paths: [packagesDir, dir, 'dist', 'startup', 'start-install.js'],
    });
    const standardFinalizePath = pathJoinAdapter({
      paths: [packagesDir, dir, 'dist', 'startup', INSTALL_FINALIZE_FILENAME],
    });

    // Check alternate path: dist/src/startup/start-install.js (for packages with rootDir: ".")
    const alternatePath = pathJoinAdapter({
      paths: [packagesDir, dir, 'dist', 'src', 'startup', 'start-install.js'],
    });
    const alternateFinalizePath = pathJoinAdapter({
      paths: [packagesDir, dir, 'dist', 'src', 'startup', INSTALL_FINALIZE_FILENAME],
    });

    const usesStandardPath = fsExistsSyncAdapter({ filePath: standardPath });
    const usesAlternatePath = !usesStandardPath && fsExistsSyncAdapter({ filePath: alternatePath });
    const installPath = usesStandardPath ? standardPath : usesAlternatePath ? alternatePath : null;

    if (installPath) {
      const packageName = packageNameContract.parse(`@dungeonmaster/${dir}`);
      const finalizeCandidatePath = usesStandardPath ? standardFinalizePath : alternateFinalizePath;
      const finalizeInstallPath = fsExistsSyncAdapter({ filePath: finalizeCandidatePath })
        ? filePathContract.parse(finalizeCandidatePath)
        : null;

      packagesWithInstallers.push({
        packageName,
        installPath: filePathContract.parse(installPath),
        finalizeInstallPath,
      });
    }
  }

  return packagesWithInstallers;
};
