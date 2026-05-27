import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';

import { timerSetTimeoutAdapterProxy } from '../../../adapters/timer/set-timeout/timer-set-timeout-adapter.proxy';
import type { ElapsedMs } from '../../../contracts/elapsed-ms/elapsed-ms-contract';
import { scanOnceLayerBrokerProxy } from './scan-once-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questGetNextStepBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
  getRegisteredTimeoutMs: () => ElapsedMs | undefined;
} => {
  const scanProxy = scanOnceLayerBrokerProxy();
  const timeoutProxy = timerSetTimeoutAdapterProxy();

  return {
    setupGuildsAndQuests: scanProxy.setupGuildsAndQuests,
    setupNoGuilds: scanProxy.setupNoGuilds,
    getRegisteredTimeoutMs: timeoutProxy.getRegisteredDelay,
  };
};
