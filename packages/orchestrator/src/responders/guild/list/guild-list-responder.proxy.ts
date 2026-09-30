import type { DirEntrySync } from '#gateway/node/fs';

import type { GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildListBrokerProxy } from '../../../brokers/guild/list/guild-list-broker.proxy';
import { GuildListResponder } from './guild-list-responder';

export const GuildListResponderProxy = (): {
  callResponder: typeof GuildListResponder;
  setupGuildList: (params: {
    config: GuildConfig;
    homeDir: string;
    homePath: string;
    guildEntries: {
      accessible: boolean;
      questsDirPath: string;
      questDirEntries: DirEntrySync[];
    }[];
  }) => void;
  setupEmptyConfig: (params: { homeDir: string; homePath: string }) => void;
} => {
  const brokerProxy = guildListBrokerProxy();

  return {
    callResponder: GuildListResponder,

    setupGuildList: (params: {
      config: GuildConfig;
      homeDir: string;
      homePath: string;
      guildEntries: {
        accessible: boolean;
        questsDirPath: string;
        questDirEntries: DirEntrySync[];
      }[];
    }): void => {
      brokerProxy.setupGuildList(params);
    },

    setupEmptyConfig: (params: { homeDir: string; homePath: string }): void => {
      brokerProxy.setupEmptyConfig(params);
    },
  };
};
