import type { GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildAddBrokerProxy } from '../../../brokers/guild/add/guild-add-broker.proxy';
import { GuildAddResponder } from './guild-add-responder';

export const GuildAddResponderProxy = (): {
  callResponder: typeof GuildAddResponder;
  setupAddGuild: (params: {
    existingConfig: GuildConfig;
    homeDir: string;
    homePath: string;
    guildsPath: string;
    guildDirPath: string;
    questsDirPath: string;
  }) => void;
  setupDuplicatePath: (params: { existingConfig: GuildConfig }) => void;
} => {
  const brokerProxy = guildAddBrokerProxy();

  return {
    callResponder: GuildAddResponder,

    setupAddGuild: (params: {
      existingConfig: GuildConfig;
      homeDir: string;
      homePath: string;
      guildsPath: string;
      guildDirPath: string;
      questsDirPath: string;
    }): void => {
      brokerProxy.setupAddGuild(params);
    },

    setupDuplicatePath: (params: { existingConfig: GuildConfig }): void => {
      brokerProxy.setupDuplicatePath(params);
    },
  };
};
