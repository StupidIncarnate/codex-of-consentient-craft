import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';

import { questActiveQuestsBrokerProxy } from '../active-quests/quest-active-quests-broker.proxy';
import { questAdvanceBrokerProxy } from '../advance/quest-advance-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
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
  setupSelfHeal: (params: { staleQuest: Quest; refreshedQuest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Quest;
} => {
  const activeQuestsProxy = questActiveQuestsBrokerProxy();
  computeNextStepFromQuestLayerBrokerProxy();
  questHasIncompleteWorkLayerBrokerProxy();
  const recoverProxy = recoverOrphanedWorkItemsLayerBrokerProxy();
  const advanceProxy = questAdvanceBrokerProxy();
  const getProxy = questGetBrokerProxy();

  return {
    setupGuildsAndQuests: activeQuestsProxy.setupGuildsAndQuests,
    setupNoGuilds: activeQuestsProxy.setupNoGuilds,
    setupModifyForQuest: recoverProxy.setupModifyForQuest,
    // Advance self-heal path: questAdvanceBroker runs a real read-modify-write against the stale
    // quest (find → load → persist), then scan re-reads the quest fresh (find → load) — queue one
    // chain per step, in call order.
    setupSelfHeal: ({
      staleQuest,
      refreshedQuest,
    }: {
      staleQuest: Quest;
      refreshedQuest: Quest;
    }): void => {
      advanceProxy.setupQuestFound({ quest: staleQuest });
      getProxy.setupQuestFound({ quest: refreshedQuest });
    },
    getAllPersistedContents: advanceProxy.getAllPersistedContents,
    getLastPersistedQuest: advanceProxy.getLastPersistedQuest,
  };
};
