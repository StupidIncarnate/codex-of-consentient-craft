import type { GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';
import { guildConfigWriteBrokerProxy } from '../../guild-config/write/guild-config-write-broker.proxy';

export const guildUpdateBrokerProxy = (): {
  setupConfig: (params: { config: GuildConfig }) => void;
} => {
  const configReadProxy = guildConfigReadBrokerProxy();
  const configWriteProxy = guildConfigWriteBrokerProxy();

  return {
    setupConfig: ({ config }: { config: GuildConfig }): void => {
      configReadProxy.setupConfig({ config });
      configWriteProxy.setupSuccess();
    },
  };
};
