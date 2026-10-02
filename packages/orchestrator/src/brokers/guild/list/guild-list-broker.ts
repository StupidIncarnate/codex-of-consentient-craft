/**
 * PURPOSE: Lists all registered guilds with runtime validity and quest count information
 *
 * USAGE:
 * const items = await guildListBroker();
 * // Returns: GuildListItem[] with valid flag and questCount for each guild
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { guildListItemContract } from '@dungeonmaster/shared/contracts';
import type { GuildListItem } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';
import { readdirEntriesSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { homeConfigReadBroker } from '../../home-config/read/home-config-read-broker';
import { homeConfigWriteBroker } from '../../home-config/write/home-config-write-broker';
import { pathIsAccessibleBroker } from '../../path/is-accessible/path-is-accessible-broker';

export const guildListBroker = async (): Promise<GuildListItem[]> => {
  const config = await homeConfigReadBroker();
  const { homePath } = dungeonmasterHomeFindBroker();

  let needsPersist = false;

  for (const guild of config.guilds) {
    if (!guild.urlSlug) {
      guild.urlSlug = nameToUrlSlugTransformer({ name: guild.name });
      needsPersist = true;
    }
  }

  if (needsPersist) {
    await homeConfigWriteBroker({ config });
  }

  const items = await Promise.all(
    config.guilds.map(async (guild) => {
      const valid = await pathIsAccessibleBroker({ path: guild.path });

      const questsDirPath = join(
        homePath,
        dungeonmasterHomeStatics.paths.guildsDir,
        guild.id,
        dungeonmasterHomeStatics.paths.questsDir,
      );

      const questsDir = questsDirPath;

      let questCount = 0;
      try {
        const entries = readdirEntriesSync(questsDir);
        questCount = entries.filter((entry) => entry.kind === 'directory').length;
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
