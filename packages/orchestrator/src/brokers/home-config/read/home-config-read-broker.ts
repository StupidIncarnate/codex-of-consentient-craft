/**
 * PURPOSE: Reads the dungeonmaster home's config file, from a caller-supplied home when one arrives and
 * from the process-wide resolution otherwise. A caller supplies one when it is reading the config
 * of a home it was HANDED rather than the one the process happens to point at — a hydration seed
 * populating a target directory. The `??` is what keeps that promise: with a home supplied,
 * `dungeonmasterHomeFindBroker` is never called, so `DUNGEONMASTER_HOME` is never read.
 *
 * USAGE:
 * const config = await homeConfigReadBroker();
 * // Returns HomeConfig with guilds array, or default { guilds: [] } if file missing
 *
 * const config = await homeConfigReadBroker({ home: '/tmp/dm-home' });
 * // Reads /tmp/dm-home/config.json, whatever DUNGEONMASTER_HOME says
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { homeConfigContract } from '@dungeonmaster/shared/contracts';
import type { HomeConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { readFileIfExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

const DEFAULT_CONFIG: HomeConfig = homeConfigContract.parse({ guilds: [] });

export const homeConfigReadBroker = async ({
  home,
}: {
  home?: string;
} = {}): Promise<HomeConfig> => {
  const homePath = home ?? dungeonmasterHomeFindBroker().homePath;

  const configFilePath = join(homePath, dungeonmasterHomeStatics.paths.configFile);

  const contents = await readFileIfExists(configFilePath);
  if (contents === null) {
    return DEFAULT_CONFIG;
  }

  const parsed: unknown = JSON.parse(contents);
  return homeConfigContract.parse(parsed);
};
