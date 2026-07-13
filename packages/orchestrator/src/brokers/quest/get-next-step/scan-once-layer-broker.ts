/**
 * PURPOSE: Layer helper for questGetNextStepBroker — performs a single FIFO scan across every active quest, picks the oldest with incomplete work, sets it on the activeQuest facade, and returns its NextStep (or null when nothing is ready anywhere)
 *
 * USAGE:
 * const step = await scanOnceLayerBroker({ activeQuest });
 * // Returns: NextStep | null — null triggers the long-poll retry in the parent broker.
 */

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { isAnyAgentRunningQuestStatusGuard } from '@dungeonmaster/shared/guards';

import type { ActiveQuestFacade } from '../../../contracts/active-quest-facade/active-quest-facade-contract';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { questActiveQuestsBroker } from '../active-quests/quest-active-quests-broker';
import { questAdvanceBroker } from '../advance/quest-advance-broker';
import { questGetBroker } from '../get/quest-get-broker';
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
  // runs any quest with an agent role active (in_progress execution) but not a paused quest
  // (it stays visible but idle).
  const dispatchable = activeEntries.filter((e) =>
    isAnyAgentRunningQuestStatusGuard({ status: e.quest.status }),
  );
  if (dispatchable.length === 0) {
    activeQuest.clear();
    return null;
  }

  // The incomplete-work gate is operations-aware: a quest whose work items are all terminal but
  // whose ledger still has non-complete operation items counts as incomplete, so the advance
  // self-heal below can run for it (the exact stall a restart between "operation complete" and
  // "advance created the next work item" would otherwise leave).
  const entry = dispatchable.find((e) => questHasIncompleteWorkLayerBroker({ quest: e.quest }));
  if (!entry) {
    activeQuest.clear();
    return null;
  }
  const { quest } = entry;

  // Resolution order when the FIFO quest has incomplete work but nothing dispatchable:
  //   1. compute directly — a ready work item exists.
  //   2. orphan recovery — an in_progress item whose agent died is flipped back to pending
  //      (keeping sessionId + resume marker) and recomputed, so a resumed orphan dispatches
  //      BEFORE advance considers creating a new item.
  //   3. advance self-heal (LAST resort) — no dispatchable work item exists at all, but the
  //      ledger has an actionable operation item: a server stop between the signal handler's
  //      atomic persist and questAdvanceBroker left the relay without its next work item.
  //      Advance creates it (idempotent, strict-1:1 guarded), then recompute from a fresh read.
  let step =
    computeNextStepFromQuestLayerBroker({ quest }) ??
    computeNextStepFromQuestLayerBroker({
      quest: await recoverOrphanedWorkItemsLayerBroker({ quest }),
    });

  if (step === null) {
    await questAdvanceBroker({ questId: quest.id });
    const refreshed = await questGetBroker({
      input: getQuestInputContract.parse({ questId: quest.id }),
    });
    step =
      refreshed.success && refreshed.quest
        ? computeNextStepFromQuestLayerBroker({ quest: refreshed.quest })
        : null;
  }

  activeQuest.setActive({ questId: quest.id });
  return step;
};
