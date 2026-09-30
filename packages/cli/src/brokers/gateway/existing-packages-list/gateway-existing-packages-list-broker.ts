/**
 * PURPOSE: Lists every EXISTING workspace package directory under `packages/*` in a consumer repo,
 * so `dungeonmaster init` can add the four-entry `imports` field to each one — every package
 * already on disk, not only ones `create-package` scaffolds later. Mirrors packageDiscoverBroker's
 * own `@`-prefixed group-folder walk (a repo may have grouped packages under its own scope, the
 * same way this repo groups the gateway under `packages/@gateway/`), but lists every package
 * carrying a `package.json` rather than only ones with an install script, and excludes the gateway
 * group itself — those four packages already declare their `imports` field at scaffold time.
 *
 * USAGE:
 * gatewayExistingPackagesListBroker({ packagesDir: FilePathStub({value: '/repo/packages'}) });
 * // Returns the absolute path of every package directory under packages/*, @gateway excluded
 */

import { join } from '#gateway/node/path';
import { existsSync, readdirSync } from '#gateway/node/fs';

const GROUP_FOLDER_PREFIX = '@';
const GATEWAY_GROUP_FOLDER = '@gateway';

export const gatewayExistingPackagesListBroker = ({
  packagesDir,
}: {
  packagesDir: string;
}): readonly string[] => {
  if (!existsSync(packagesDir)) {
    return [];
  }

  const topLevelDirs = readdirSync(packagesDir);

  const candidateDirs = topLevelDirs.flatMap((dir) => {
    if (dir === GATEWAY_GROUP_FOLDER) {
      return [];
    }
    if (!dir.startsWith(GROUP_FOLDER_PREFIX)) {
      return [join(packagesDir, dir)];
    }
    const groupDir = join(packagesDir, dir);
    return readdirSync(groupDir).map((child) => join(groupDir, child));
  });

  return candidateDirs
    .filter((candidateDir) => existsSync(join(candidateDir, 'package.json')))
    .map((candidateDir) => candidateDir);
};
