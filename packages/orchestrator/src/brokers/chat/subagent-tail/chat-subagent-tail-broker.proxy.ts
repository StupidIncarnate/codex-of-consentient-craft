import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';

type GuildConfig = Parameters<ReturnType<typeof guildGetBrokerProxy>['setupConfig']>[0]['config'];

export const chatSubagentTailBrokerProxy = (): {
  setupGuild: (params: { config: GuildConfig; homeDir: string }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
} => {
  const guildProxy = guildGetBrokerProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const tailProxy = fsWatchTailAdapterProxy();

  return {
    setupGuild: ({ config, homeDir }: { config: GuildConfig; homeDir: string }): void => {
      guildProxy.setupConfig({ config });
      homedirProxy.returns({ path: homeDir });
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
  };
};
