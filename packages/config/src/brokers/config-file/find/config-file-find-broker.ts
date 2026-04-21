/**
 * PURPOSE: Finds the nearest .dungeonmaster.json (preferred) or .dungeonmaster (legacy) config file by searching up the directory tree
 *
 * USAGE:
 * await configFileFindBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns FilePath to nearest config file (prefers .dungeonmaster.json, falls back to .dungeonmaster)
 */

import { configRootFindBroker } from '@dungeonmaster/shared/brokers';
import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { ConfigNotFoundError } from '../../../errors/config-not-found/config-not-found-error';
import type { FilePath } from '@dungeonmaster/shared/contracts';

const F_OK = 0;

export const configFileFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  const searchPath = currentPath ?? pathDirnameAdapter({ path: startPath });

  try {
    const rootDir = await configRootFindBroker({ startPath: searchPath });

    const preferredPath = pathJoinAdapter({
      paths: [rootDir, dungeonmasterHomeStatics.paths.projectConfigFile],
    });

    try {
      await fsAccessAdapter({ filePath: preferredPath, mode: F_OK });
      return preferredPath;
    } catch {
      // fall through to legacy filename
    }

    return pathJoinAdapter({
      paths: [rootDir, dungeonmasterHomeStatics.paths.legacyProjectConfigFile],
    });
  } catch {
    throw new ConfigNotFoundError({ startPath });
  }
};
