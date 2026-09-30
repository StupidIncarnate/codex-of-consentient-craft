/**
 * PURPOSE: Resolves the dungeonmaster home path — DUNGEONMASTER_HOME verbatim if set, else os.homedir() + '/.dungeonmaster'
 *
 * USAGE:
 * const { homePath } = dungeonmasterHomeFindBroker();
 * // Returns { homePath: FilePath } — the complete path to the dungeonmaster data dir
 */

import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { getEnv } from '#gateway/node/process';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const dungeonmasterHomeFindBroker = (): { homePath: string } => {
  const envHome = getEnv('DUNGEONMASTER_HOME');

  if (envHome !== undefined && envHome !== '') {
    return { homePath: envHome };
  }

  const homePath = join(homedir(), locationsStatics.dungeonmasterHome.dir);

  return { homePath };
};
