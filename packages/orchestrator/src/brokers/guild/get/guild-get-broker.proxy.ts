import type { GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';

export const guildGetBrokerProxy = (): {
  setupConfig: (params: { config: GuildConfig }) => void;
} => {
  const configReadProxy = guildConfigReadBrokerProxy();

  return {
    setupConfig: ({ config }: { config: GuildConfig }): void => {
      configReadProxy.setupConfig({ config });
    },
  };
};
