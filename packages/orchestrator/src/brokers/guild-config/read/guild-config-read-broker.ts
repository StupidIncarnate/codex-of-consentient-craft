/**
 * PURPOSE: Reads the dungeonmaster guild config, from a caller-supplied home when one arrives and
 * from the process-wide resolution otherwise. A caller supplies one when it is reading the config
 * of a home it was HANDED rather than the one the process happens to point at — a hydration seed
 * populating a target directory. The `??` is what keeps that promise: with a home supplied,
 * `dungeonmasterHomeFindBroker` is never called, so `DUNGEONMASTER_HOME` is never read.
 *
 * USAGE:
 * const config = await guildConfigReadBroker();
 * // Returns GuildConfig with guilds array, or default { guilds: [] } if file missing
 *
 * const config = await guildConfigReadBroker({ home: absoluteFilePathContract.parse('/tmp/dm-home') });
 * // Reads /tmp/dm-home/config.json, whatever DUNGEONMASTER_HOME says
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { guildConfigContract } from '@dungeonmaster/shared/contracts';
import type { GuildConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { readFileIfExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

const DEFAULT_CONFIG: GuildConfig = guildConfigContract.parse({ guilds: [] });

export const guildConfigReadBroker = async ({
  home,
}: {
  home?: string;
} = {}): Promise<GuildConfig> => {
  const homePath = home ?? dungeonmasterHomeFindBroker().homePath;

  const configFilePath = join(homePath, dungeonmasterHomeStatics.paths.configFile);

  const contents = await readFileIfExists(configFilePath);
  if (contents === null) {
    return DEFAULT_CONFIG;
  }

  const parsed: unknown = JSON.parse(contents);
  return guildConfigContract.parse(parsed);
};
