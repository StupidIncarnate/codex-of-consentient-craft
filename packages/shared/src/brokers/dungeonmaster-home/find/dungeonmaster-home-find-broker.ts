/**
 * PURPOSE: Resolves the dungeonmaster home path — DUNGEONMASTER_HOME verbatim if set, else os.homedir() + '/.dungeonmaster'
 *
 * USAGE:
 * const { homePath } = dungeonmasterHomeFindBroker();
 * // Returns { homePath: FilePath } — the complete path to the dungeonmaster data dir
 */

import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const dungeonmasterHomeFindBroker = (): { homePath: FilePath } => {
  const envHome = process.env.DUNGEONMASTER_HOME;

  if (envHome !== undefined && envHome !== '') {
    return { homePath: filePathContract.parse(envHome) };
  }

  const homePath = filePathContract.parse(join(homedir(), locationsStatics.dungeonmasterHome.dir));

  return { homePath };
};
