import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';

import { computeNextStepFromQuestLayerBrokerProxy } from './compute-next-step-from-quest-layer-broker.proxy';
import { loadActiveQuestsLayerBrokerProxy } from './load-active-quests-layer-broker.proxy';
import { questHasIncompleteWorkLayerBrokerProxy } from './quest-has-incomplete-work-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const scanOnceLayerBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
} => {
  const loadActiveQuestsProxy = loadActiveQuestsLayerBrokerProxy();
  computeNextStepFromQuestLayerBrokerProxy();
  questHasIncompleteWorkLayerBrokerProxy();

  return {
    setupGuildsAndQuests: loadActiveQuestsProxy.setupGuildsAndQuests,
    setupNoGuilds: loadActiveQuestsProxy.setupNoGuilds,
  };
};
