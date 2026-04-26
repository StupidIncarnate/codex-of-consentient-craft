import type { GuildConfig, GuildStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';
import { guildConfigWriteBrokerProxy } from '../../guild-config/write/guild-config-write-broker.proxy';
import { guildGetBroker } from './guild-get-broker';

registerModuleMock({ module: './guild-get-broker' });

type Guild = ReturnType<typeof GuildStub>;

export const guildGetBrokerProxy = (): {
  setupConfig: (params: { config: GuildConfig }) => void;
  setupDirectGuild: (params: { guild: Guild }) => void;
} => {
  const configReadProxy = guildConfigReadBrokerProxy();
  const configWriteProxy = guildConfigWriteBrokerProxy();

  const mocked = guildGetBroker as jest.MockedFunction<typeof guildGetBroker>;
  // Default: passthrough so existing consumers driving the fs chain keep working.
  const realMod = requireActual<{ guildGetBroker: typeof guildGetBroker }>({
    module: './guild-get-broker',
  });
  mocked.mockImplementation(realMod.guildGetBroker);

  return {
    setupConfig: ({ config }: { config: GuildConfig }): void => {
      configReadProxy.setupConfig({ config });
      configWriteProxy.setupSuccess();
    },
    setupDirectGuild: ({ guild }: { guild: Guild }): void => {
      mocked.mockResolvedValueOnce(guild);
    },
  };
};
