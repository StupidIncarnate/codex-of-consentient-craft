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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { guildConfigContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, GuildConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

const DEFAULT_CONFIG: GuildConfig = guildConfigContract.parse({ guilds: [] });

export const guildConfigReadBroker = async ({
  home,
}: {
  home?: AbsoluteFilePath;
} = {}): Promise<GuildConfig> => {
  const homePath = home ?? dungeonmasterHomeFindBroker().homePath;

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
