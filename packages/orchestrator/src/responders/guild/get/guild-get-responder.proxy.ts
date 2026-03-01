import type { GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { GuildGetResponder } from './guild-get-responder';

export const GuildGetResponderProxy = (): {
  callResponder: typeof GuildGetResponder;
  setupConfig: (params: { config: GuildConfig }) => void;
} => {
  const brokerProxy = guildGetBrokerProxy();

  return {
    callResponder: GuildGetResponder,

    setupConfig: ({ config }: { config: GuildConfig }): void => {
      brokerProxy.setupConfig({ config });
    },
  };
};
