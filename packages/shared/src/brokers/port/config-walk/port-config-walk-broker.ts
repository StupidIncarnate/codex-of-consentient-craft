/**
 * PURPOSE: Walks up from a starting directory looking for .dungeonmaster.json and returns its dungeonmaster.port field
 *
 * USAGE:
 * const port = portConfigWalkBroker({ dir: absoluteFilePathContract.parse('/project/packages/web') });
 * // Returns the port as NetworkPort if found and parseable, else undefined
 */

import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { NetworkPort } from '../../../contracts/network-port/network-port-contract';
import { projectConfigContract } from '../../../contracts/project-config/project-config-contract';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';

export const portConfigWalkBroker = ({
  dir,
}: {
  dir: AbsoluteFilePath;
}): NetworkPort | undefined => {
  const configPath = pathJoinAdapter({
    paths: [dir, dungeonmasterHomeStatics.paths.projectConfigFile],
  });
  try {
    const contents = fsReadFileSyncAdapter({
      filePath: absoluteFilePathContract.parse(configPath),
    });
    const result = projectConfigContract.safeParse(JSON.parse(contents));
    if (!result.success) return undefined;
    return result.data.dungeonmaster?.port;
  } catch {
    const parent = pathDirnameAdapter({ path: filePathContract.parse(dir) });
    if (parent === dir) return undefined;
    return portConfigWalkBroker({ dir: absoluteFilePathContract.parse(parent) });
  }
};
