import type { Dirent } from 'fs';

import type { FilePath, GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildListBrokerProxy } from '../../../brokers/guild/list/guild-list-broker.proxy';
import { GuildListResponder } from './guild-list-responder';

export const GuildListResponderProxy = (): {
  callResponder: typeof GuildListResponder;
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
  const brokerProxy = guildListBrokerProxy();

  return {
    callResponder: GuildListResponder,

    setupGuildList: (params: {
      config: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildEntries: {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
    }): void => {
      brokerProxy.setupGuildList(params);
    },

    setupEmptyConfig: (params: { homeDir: string; homePath: FilePath }): void => {
      brokerProxy.setupEmptyConfig(params);
    },
  };
};
