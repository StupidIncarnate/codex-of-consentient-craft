import { dungeonmasterHomeEnsureBrokerProxy } from '@dungeonmaster/shared/testing';
import type { FilePath, GuildConfig, GuildListItem } from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';

import { guildAddBrokerProxy } from '../../guild/add/guild-add-broker.proxy';
import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';

export const smoketestEnsureGuildBrokerProxy = (): {
  setupGuildPresent: (params: {
    config: GuildConfig;
    homeDir: string;
    homePath: FilePath;
    guildEntries: readonly {
      accessible: boolean;
      questsDirPath: FilePath;
      questDirEntries: Dirent[];
    }[];
  }) => void;
  findMatchingGuildByName: (params: {
    guilds: readonly GuildListItem[];
    name: string;
  }) => GuildListItem | undefined;
} => {
  dungeonmasterHomeEnsureBrokerProxy();
  const listProxy = guildListBrokerProxy();
  guildAddBrokerProxy();

  return {
    setupGuildPresent: ({
      config,
      homeDir,
      homePath,
      guildEntries,
    }: {
      config: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildEntries: readonly {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
    }): void => {
      listProxy.setupGuildList({
        config,
        homeDir,
        homePath,
        guildEntries: guildEntries.slice(),
      });
    },
    findMatchingGuildByName: ({
      guilds,
      name,
    }: {
      guilds: readonly GuildListItem[];
      name: string;
    }): GuildListItem | undefined => guilds.find((guild) => guild.name === name),
  };
};
