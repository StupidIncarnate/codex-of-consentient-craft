import type { HomeConfig } from '@dungeonmaster/shared/contracts';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { GuildGetResponder } from './guild-get-responder';

export const GuildGetResponderProxy = (): {
  callResponder: typeof GuildGetResponder;
  setupConfig: (params: { config: HomeConfig }) => void;
} => {
  const brokerProxy = guildGetBrokerProxy();

  return {
    callResponder: GuildGetResponder,

    setupConfig: ({ config }: { config: HomeConfig }): void => {
      brokerProxy.setupConfig({ config });
    },
  };
};
