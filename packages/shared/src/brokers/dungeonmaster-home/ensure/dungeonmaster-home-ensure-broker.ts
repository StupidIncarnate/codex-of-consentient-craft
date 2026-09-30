/**
 * PURPOSE: Creates ~/.dungeonmaster/ and ~/.dungeonmaster/guilds/ directories if they do not exist
 *
 * USAGE:
 * const { homePath, guildsPath } = await dungeonmasterHomeEnsureBroker();
 * // Creates both directories and returns their paths
 */

import { dungeonmasterHomeEnsureResultContract } from '../../../contracts/dungeonmaster-home-ensure-result/dungeonmaster-home-ensure-result-contract';
import type { DungeonmasterHomeEnsureResult } from '../../../contracts/dungeonmaster-home-ensure-result/dungeonmaster-home-ensure-result-contract';
import { ensureDir } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';
import { dungeonmasterHomeFindBroker } from '../find/dungeonmaster-home-find-broker';

export const dungeonmasterHomeEnsureBroker = async (): Promise<DungeonmasterHomeEnsureResult> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  await ensureDir(homePath);

  const guildsPath = join(homePath, dungeonmasterHomeStatics.paths.guildsDir);

  await ensureDir(guildsPath);

  return dungeonmasterHomeEnsureResultContract.parse({ homePath, guildsPath });
};
