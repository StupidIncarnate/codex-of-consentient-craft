import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';

import { questActiveQuestsBrokerProxy } from '../active-quests/quest-active-quests-broker.proxy';
import { computeNextStepFromQuestLayerBrokerProxy } from './compute-next-step-from-quest-layer-broker.proxy';
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
  const activeQuestsProxy = questActiveQuestsBrokerProxy();
  computeNextStepFromQuestLayerBrokerProxy();
  questHasIncompleteWorkLayerBrokerProxy();
  const recoverProxy = recoverOrphanedWorkItemsLayerBrokerProxy();

  return {
    setupGuildsAndQuests: activeQuestsProxy.setupGuildsAndQuests,
    setupNoGuilds: activeQuestsProxy.setupNoGuilds,
    setupModifyForQuest: recoverProxy.setupModifyForQuest,
  };
};
