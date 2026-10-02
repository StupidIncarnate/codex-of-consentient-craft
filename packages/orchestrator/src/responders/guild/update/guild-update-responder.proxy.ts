import type { HomeConfig } from '@dungeonmaster/shared/contracts';

import { guildUpdateBrokerProxy } from '../../../brokers/guild/update/guild-update-broker.proxy';
import { GuildUpdateResponder } from './guild-update-responder';

export const GuildUpdateResponderProxy = (): {
  callResponder: typeof GuildUpdateResponder;
  setupConfig: (params: { config: HomeConfig }) => void;
} => {
  const brokerProxy = guildUpdateBrokerProxy();

  return {
    callResponder: GuildUpdateResponder,

    setupConfig: ({ config }: { config: HomeConfig }): void => {
      brokerProxy.setupConfig({ config });
    },
  };
};
