/**
 * PURPOSE: Walks up from a starting directory looking for .dungeonmaster.json and returns its dungeonmaster.port field
 *
 * USAGE:
 * const port = portConfigWalkBroker({ dir: absoluteFilePathContract.parse('/project/packages/web') });
 * // Returns the port as NetworkPort if found and parseable, else undefined
 */

import { readFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { NetworkPort } from '../../../contracts/network-port/network-port-contract';
import { projectConfigContract } from '../../../contracts/project-config/project-config-contract';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';

export const portConfigWalkBroker = ({
  dir,
}: {
  dir: string;
}): NetworkPort | undefined => {
  const configPath = join(dir, dungeonmasterHomeStatics.paths.projectConfigFile);
  try {
    const contents = contentTextContract.parse(readFileSync(configPath));
    const result = projectConfigContract.safeParse(JSON.parse(contents));
    if (!result.success) return undefined;
    return result.data.dungeonmaster?.port;
  } catch {
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    return portConfigWalkBroker({ dir: parent });
  }
};
