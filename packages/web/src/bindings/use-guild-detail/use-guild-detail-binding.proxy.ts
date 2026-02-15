import type { GuildStub } from '@dungeonmaster/shared/contracts';

import { guildDetailBrokerProxy } from '../../brokers/guild/detail/guild-detail-broker.proxy';

type Guild = ReturnType<typeof GuildStub>;

export const useGuildDetailBindingProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupError: () => void;
} => {
  const brokerProxy = guildDetailBrokerProxy();

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      brokerProxy.setupGuild({ guild });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
  };
};
