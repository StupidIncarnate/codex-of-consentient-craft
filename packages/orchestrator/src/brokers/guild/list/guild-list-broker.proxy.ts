import {
  dungeonmasterHomeFindBrokerProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath, GuildConfig } from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';

import { pathIsAccessibleBrokerProxy } from '../../path/is-accessible/path-is-accessible-broker.proxy';
import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';

export const guildListBrokerProxy = (): {
  setupGuildList: (params: {
    config: GuildConfig;
    homeDir: string;
    homePath: FilePath;
    guildEntries: {
      accessible: boolean;
      questsDirPath: FilePath;
      questDirEntries: Dirent[];
    }[];
  }) => void;
  setupEmptyConfig: (params: { homeDir: string; homePath: FilePath }) => void;
} => {
  const configReadProxy = guildConfigReadBrokerProxy();
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const accessibleProxy = pathIsAccessibleBrokerProxy();

  return {
    setupGuildList: ({
      config,
      homeDir,
      homePath,
      guildEntries,
    }: {
      config: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildEntries: {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
    }): void => {
      configReadProxy.setupConfig({ config });
      homeFindProxy.setupHomePath({ homeDir, homePath });

      for (const entry of guildEntries) {
        accessibleProxy.setupResult({ result: entry.accessible });
        pathJoinProxy.returns({ result: entry.questsDirPath });
        readdirProxy.returns({ entries: entry.questDirEntries });
      }
    },

    setupEmptyConfig: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      configReadProxy.setupConfig({ config: { guilds: [] } });
      homeFindProxy.setupHomePath({ homeDir, homePath });
    },
  };
};
