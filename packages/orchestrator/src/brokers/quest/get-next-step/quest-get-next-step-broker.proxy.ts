import type { GuildListItem } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import type { TimeoutMsStub } from '@dungeonmaster/shared/contracts/timeout-ms/timeout-ms.stub';
import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { timerSleepBrokerProxy } from '../../timer/sleep/timer-sleep-broker.proxy';
import { scanOnceLayerBrokerProxy } from './scan-once-layer-broker.proxy';

type TimeoutMs = ReturnType<typeof TimeoutMsStub>;

type Quest = ReturnType<typeof QuestStub>;

export const questGetNextStepBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
  setupModifyForQuest: (params: { quest: Quest }) => void;
  setupPollInterval: (params: { ms: number }) => void;
  getRegisteredTimeoutMs: () => TimeoutMs | undefined;
} => {
  const scanProxy = scanOnceLayerBrokerProxy();
  // The broker's own default poll interval is the dispatch loop's; a test passing another one
  // stages it through setupPollInterval.
  const sleepProxy = timerSleepBrokerProxy();
  sleepProxy.setupResolvesImmediately({ ms: orchestrationDispatchStatics.loop.longPollIntervalMs });

  return {
    setupGuildsAndQuests: scanProxy.setupGuildsAndQuests,
    setupNoGuilds: scanProxy.setupNoGuilds,
    setupModifyForQuest: scanProxy.setupModifyForQuest,
    setupPollInterval: ({ ms }: { ms: number }): void => {
      sleepProxy.setupResolvesImmediately({ ms });
    },
    getRegisteredTimeoutMs: (): TimeoutMs | undefined => sleepProxy.getRegisteredDelays().at(-1),
  };
};
