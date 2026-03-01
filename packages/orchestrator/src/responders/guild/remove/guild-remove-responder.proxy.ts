import type { GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildRemoveBrokerProxy } from '../../../brokers/guild/remove/guild-remove-broker.proxy';
import { GuildRemoveResponder } from './guild-remove-responder';

export const GuildRemoveResponderProxy = (): {
  callResponder: typeof GuildRemoveResponder;
  setupConfig: (params: { config: GuildConfig }) => void;
} => {
  const brokerProxy = guildRemoveBrokerProxy();

  return {
    callResponder: GuildRemoveResponder,

    setupConfig: ({ config }: { config: GuildConfig }): void => {
      brokerProxy.setupConfig({ config });
    },
  };
};
