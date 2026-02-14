/**
 * PURPOSE: Lists all registered guilds with runtime validity and quest count information
 *
 * USAGE:
 * const items = await guildListBroker();
 * // Returns: GuildListItem[] with valid flag and questCount for each guild
 */

import { fsReaddirWithTypesAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract, guildListItemContract } from '@dungeonmaster/shared/contracts';
import type { GuildListItem } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { pathIsAccessibleBroker } from '../../path/is-accessible/path-is-accessible-broker';
import { guildConfigReadBroker } from '../../guild-config/read/guild-config-read-broker';

export const guildListBroker = async (): Promise<GuildListItem[]> => {
  const config = await guildConfigReadBroker();
  const { homePath } = dungeonmasterHomeFindBroker();

  const items = await Promise.all(
    config.guilds.map(async (guild) => {
      const valid = await pathIsAccessibleBroker({ path: guild.path });

      const questsDirPath = pathJoinAdapter({
        paths: [
          homePath,
          dungeonmasterHomeStatics.paths.guildsDir,
          guild.id,
          dungeonmasterHomeStatics.paths.questsDir,
        ],
      });

      const questsDir = absoluteFilePathContract.parse(questsDirPath);

      let questCount = 0;
      try {
        const entries = fsReaddirWithTypesAdapter({ dirPath: questsDir });
        questCount = entries.filter((entry) => entry.isDirectory()).length;
      } catch {
        // Directory doesn't exist yet - default to 0
      }

      return guildListItemContract.parse({
        ...guild,
        valid,
        questCount,
      });
    }),
  );

  return items;
};
