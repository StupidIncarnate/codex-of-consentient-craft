/**
 * PURPOSE: Discovers all packages with install scripts in the dungeonmaster monorepo. Also reports
 * each package's OPTIONAL `start-install-finalize.js` — a sibling of `start-install.js` in the same
 * `dist/startup/` (or `dist/src/startup/`) directory — so the CLI orchestration layer's "after all
 * installs" pass knows, per package, whether one exists without importing anything.
 *
 * USAGE:
 * const packages = packageDiscoverBroker({
 *   dungeonmasterRoot: filePathContract.parse('/home/user/projects/dungeonmaster')
 * });
 * // Returns array of {packageName, installPath, finalizeInstallPath} for each package with
 * // start-install.js; finalizeInstallPath is null when that package has no finalize step
 */

import { join } from '#gateway/node/path';
import { existsSync, readdirSync } from '#gateway/node/fs';
import { fileNameContract } from '@dungeonmaster/shared/contracts';
import type { FileName } from '@dungeonmaster/shared/contracts';

// A directory directly under `packages/` whose name starts with `@` is a scope/group folder, not
// a package itself — the same nesting `node_modules/@scope/name` uses. Its children are the real
// packages, found on disk at `packages/<group>/<child>` but still named `@dungeonmaster/<child>`.
const GROUP_FOLDER_PREFIX = '@';

const INSTALL_FINALIZE_FILENAME = 'start-install-finalize.js';

export const packageDiscoverBroker = ({
  dungeonmasterRoot,
}: {
  dungeonmasterRoot: string;
}): { packageName: string; installPath: string; finalizeInstallPath: string | null }[] => {
  const monorepoPackagesDir = join(dungeonmasterRoot, 'packages');
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

  const packagesWithInstallers: {
    packageName: string;
    installPath: string;
    finalizeInstallPath: string | null;
  }[] = [];

  for (const { relativeDir, packageDirName } of candidates) {
    // Check standard path: dist/startup/start-install.js
    const standardDir = join(packagesDir, ...relativeDir, 'dist', 'startup');

    // Check alternate path: dist/src/startup/start-install.js (for packages with rootDir: ".")
    const alternateDir = join(packagesDir, ...relativeDir, 'dist', 'src', 'startup');

    const standardPath = join(standardDir, 'start-install.js');
    const alternatePath = join(alternateDir, 'start-install.js');

    const installDir = existsSync(standardPath)
      ? standardDir
      : existsSync(alternatePath)
        ? alternateDir
        : null;

    if (installDir) {
      const packageName = `@dungeonmaster/${packageDirName}`;
      const finalizeCandidatePath = join(installDir, INSTALL_FINALIZE_FILENAME);
      const finalizeInstallPath = existsSync(finalizeCandidatePath)
        ? finalizeCandidatePath
        : null;

      packagesWithInstallers.push({
        packageName,
        installPath: join(installDir, 'start-install.js'),
        finalizeInstallPath,
      });
    }
  }

  return packagesWithInstallers;
};
