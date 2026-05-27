/**
 * PURPOSE: Layer helper for questGetNextStepBroker — performs a single FIFO scan across every active quest, picks the oldest with incomplete work, sets it on the activeQuest facade, and returns its NextStep (or null when nothing is ready anywhere)
 *
 * USAGE:
 * const step = await scanOnceLayerBroker({ activeQuest });
 * // Returns: NextStep | null — null triggers the long-poll retry in the parent broker.
 */

import type { ActiveQuestFacade } from '../../../contracts/active-quest-facade/active-quest-facade-contract';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { computeNextStepFromQuestLayerBroker } from './compute-next-step-from-quest-layer-broker';
import { loadActiveQuestsLayerBroker } from './load-active-quests-layer-broker';
import { questHasIncompleteWorkLayerBroker } from './quest-has-incomplete-work-layer-broker';

export const scanOnceLayerBroker = async ({
  activeQuest,
}: {
  activeQuest: ActiveQuestFacade;
}): Promise<NextStep | null> => {
  const activeQuests = await loadActiveQuestsLayerBroker();
  if (activeQuests.length === 0) {
    activeQuest.clear();
    return null;
  }

  // FIFO by createdAt — quest with oldest createdAt that has incomplete work goes first.
  // ISO-8601 timestamps sort lexicographically.
  const sortedQuests = [...activeQuests].sort((a, b) =>
    String(a.createdAt).localeCompare(String(b.createdAt)),
  );

  const quest = sortedQuests.find((q) => questHasIncompleteWorkLayerBroker({ quest: q }));
  if (!quest) {
    activeQuest.clear();
    return null;
  }

  const step = computeNextStepFromQuestLayerBroker({ quest });
  activeQuest.setActive({ questId: quest.id });
  return step;
};
