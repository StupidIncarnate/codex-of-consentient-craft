import type { HomeConfig } from '@dungeonmaster/shared/contracts';

import { homeConfigReadBrokerProxy } from '../../home-config/read/home-config-read-broker.proxy';
import { homeConfigWriteBrokerProxy } from '../../home-config/write/home-config-write-broker.proxy';

export const guildUpdateBrokerProxy = (): {
  setupConfig: (params: { config: HomeConfig }) => void;
} => {
  const configReadProxy = homeConfigReadBrokerProxy();
  const configWriteProxy = homeConfigWriteBrokerProxy();

  return {
    setupConfig: ({ config }: { config: HomeConfig }): void => {
      configReadProxy.setupConfig({ config });
      configWriteProxy.setupSuccess();
    },
  };
};
