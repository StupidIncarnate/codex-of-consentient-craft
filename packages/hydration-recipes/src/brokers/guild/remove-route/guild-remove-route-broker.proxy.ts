import { guildRemoveBrokerProxy } from '@dungeonmaster/orchestrator/brokers/guild/remove/guild-remove-broker.proxy';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';

import { dmHttpRequestBrokerProxy } from '../../dm/http-request/dm-http-request-broker.proxy';

export const guildRemoveRouteBrokerProxy = (): {
  succeeds: ({ guildId }: { guildId: string }) => void;
} => {
  const removeProxy = guildRemoveBrokerProxy();
  // dmHttpRequestBroker's own branching (target.request vs global fetch) is exercised in the
  // HTTP-branch tests via a plain `target.request` closure — the same technique
  // `dm-http-request-broker.test.ts` uses at the broker's own level, which lets a test assert the
  // exact method/path/guildId sent without a fetch mock to address.
  dmHttpRequestBrokerProxy();

  return {
    succeeds: ({ guildId }: { guildId: string }): void => {
      removeProxy.setupConfig({ config: { guilds: [GuildStub({ id: guildId })] } });
    },
  };
};
