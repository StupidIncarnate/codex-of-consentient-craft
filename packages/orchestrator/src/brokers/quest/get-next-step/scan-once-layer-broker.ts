/**
 * PURPOSE: Layer helper for questGetNextStepBroker — performs a single FIFO scan across every active quest, picks the oldest with incomplete work, sets it on the activeQuest facade, and returns its NextStep (or null when nothing is ready anywhere)
 *
 * USAGE:
 * const step = await scanOnceLayerBroker({ activeQuest });
 * // Returns: NextStep | null — null triggers the long-poll retry in the parent broker.
 */

import { isActivelyExecutingQuestStatusGuard } from '@dungeonmaster/shared/guards';

import type { ActiveQuestFacade } from '../../../contracts/active-quest-facade/active-quest-facade-contract';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { questActiveQuestsBroker } from '../active-quests/quest-active-quests-broker';
import { computeNextStepFromQuestLayerBroker } from './compute-next-step-from-quest-layer-broker';
import { questHasIncompleteWorkLayerBroker } from './quest-has-incomplete-work-layer-broker';
import { recoverOrphanedWorkItemsLayerBroker } from './recover-orphaned-work-items-layer-broker';

export const scanOnceLayerBroker = async ({
  activeQuest,
}: {
  activeQuest: ActiveQuestFacade;
}): Promise<NextStep | null> => {
  // Shared discovery: FIFO-ordered (oldest createdAt first) active quests, re-read from disk on
  // every scan. /queue renders this same list; here we dispatch the head with incomplete work.
  const activeEntries = await questActiveQuestsBroker();
  // The shared discovery also carries user-paused quests (so /queue lists them). The dispatcher
  // only runs quests that are actively executing — a paused quest stays visible but idle.
  const dispatchable = activeEntries.filter((e) =>
    isActivelyExecutingQuestStatusGuard({ status: e.quest.status }),
  );
  if (dispatchable.length === 0) {
    activeQuest.clear();
    return null;
  }

  const entry = dispatchable.find((e) => questHasIncompleteWorkLayerBroker({ quest: e.quest }));
  if (!entry) {
    activeQuest.clear();
    return null;
  }
  const { quest } = entry;

  // When the FIFO quest has incomplete work but yields nothing dispatchable, its only
  // non-terminal items are orphaned in_progress work: the /dumpster-launch loop only calls
  // get-next-step with no Task it dispatched in flight, so an in_progress item means its agent
  // terminated without signalling back (the user killed it, or it crashed). Reset those orphans
  // to pending and recompute so they re-dispatch instead of the quest stalling on idle forever.
  const step =
    computeNextStepFromQuestLayerBroker({ quest }) ??
    computeNextStepFromQuestLayerBroker({
      quest: await recoverOrphanedWorkItemsLayerBroker({ quest }),
    });

  activeQuest.setActive({ questId: quest.id });
  return step;
};
