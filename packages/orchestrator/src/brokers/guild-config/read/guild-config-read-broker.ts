/**
 * PURPOSE: Reads the dungeonmaster guild config from ~/.dungeonmaster/config.json
 *
 * USAGE:
 * const config = await guildConfigReadBroker();
 * // Returns GuildConfig with guilds array, or default { guilds: [] } if file missing
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { guildConfigContract } from '@dungeonmaster/shared/contracts';
import type { GuildConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

const DEFAULT_CONFIG: GuildConfig = guildConfigContract.parse({ guilds: [] });

export const guildConfigReadBroker = async (): Promise<GuildConfig> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const configFilePath = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.configFile],
  });

  try {
    const contents = await fsReadFileAdapter({ filePath: configFilePath });
    const parsed: unknown = JSON.parse(contents);
    return guildConfigContract.parse(parsed);
  } catch (error) {
    if (error instanceof Error && 'cause' in error) {
      const { cause } = error;
      if (cause instanceof Error && 'code' in cause && cause.code === 'ENOENT') {
        return DEFAULT_CONFIG;
      }
    }

    throw error;
  }
};
