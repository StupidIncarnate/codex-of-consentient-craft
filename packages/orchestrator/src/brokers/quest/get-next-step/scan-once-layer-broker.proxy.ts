import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';

import { computeNextStepFromQuestLayerBrokerProxy } from './compute-next-step-from-quest-layer-broker.proxy';
import { loadActiveQuestsLayerBrokerProxy } from './load-active-quests-layer-broker.proxy';
import { questHasIncompleteWorkLayerBrokerProxy } from './quest-has-incomplete-work-layer-broker.proxy';
import { recoverOrphanedWorkItemsLayerBrokerProxy } from './recover-orphaned-work-items-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const scanOnceLayerBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
  setupModifyForQuest: (params: { quest: Quest }) => void;
} => {
  const loadActiveQuestsProxy = loadActiveQuestsLayerBrokerProxy();
  computeNextStepFromQuestLayerBrokerProxy();
  questHasIncompleteWorkLayerBrokerProxy();
  const recoverProxy = recoverOrphanedWorkItemsLayerBrokerProxy();

  return {
    setupGuildsAndQuests: loadActiveQuestsProxy.setupGuildsAndQuests,
    setupNoGuilds: loadActiveQuestsProxy.setupNoGuilds,
    setupModifyForQuest: recoverProxy.setupModifyForQuest,
  };
};
