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
import { questResumeTriggerContract } from '../../../contracts/quest-resume-trigger/quest-resume-trigger-contract';
import { worktreeEnsureQuestBranchBroker } from '../../worktree/ensure-quest-branch/worktree-ensure-quest-branch-broker';
import { questActiveQuestsBroker } from '../active-quests/quest-active-quests-broker';
import { questAdvanceBroker } from '../advance/quest-advance-broker';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { blockOnMissingWorktreeLayerBroker } from './block-on-missing-worktree-layer-broker';
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
  // All three run BEFORE the worktree gate below, because that gate's answer depends on which step
  // this quest actually lands on, and a null step is not yet an answer — it is the input to the two
  // resolutions underneath it.
  let step = computeNextStepFromQuestLayerBroker({ quest });

  if (step === null) {
    const recovery = await recoverOrphanedWorkItemsLayerBroker({ quest });

    // Recovery escalated an exhausted orphan and the quest is now `blocked`. The status filter that
    // admitted this quest ran BEFORE that write, so nothing below would notice — and both remaining
    // steps would act on a halted quest: advance would mint (and this scan would dispatch) the next
    // operation item's work item, and the recovered copy still reads `pending` for items the block
    // just drained to `skipped`. Stop here; the user's resume is what restarts dispatch.
    if (recovery.blocked) {
      activeQuest.clear();
      return null;
    }

    step = computeNextStepFromQuestLayerBroker({ quest: recovery.quest });
  }

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

  // The quest's own recorded worktree, not a guild-path-derived fallback. A `repo-root`
  // resolution (no worktreePath — a legacy pre-worktree quest) falls straight through: it is
  // meant to run from the repo root checkout. A `missing-worktree` resolution has no such
  // fallback — the tree the quest itself created and then lost is not something the dispatcher
  // can route around, and continuing would dispatch this quest's agents into the repo root
  // checkout, which is a DIFFERENT branch's source. Block and stop scanning this quest.
  //
  // THE GATE RUNS LAST, on the FULLY RESOLVED step, and that placement is load-bearing twice over.
  // It is what lets riftcarver through: riftcarver is the role that OWNS creating this worktree and
  // its own done-check treats a recorded-but-missing path as "not done" and re-creates it, so
  // halting ahead of it would make that recovery unreachable and leave the quest permanently
  // blocked by the one step that could have fixed it. And a `pt N` carve whose work item was never
  // minted (a crash between the previous carve's ledger write and its advance call) arrives here as
  // a NULL step, so a gate placed above the self-heal would block before the self-heal could mint
  // that work item — and every resume would re-run the identical sequence. Nothing above this point
  // dispatches anything: orphan recovery only flips an `in_progress` work item back to `pending`,
  // and advance only mints a work item on the ledger. Both are safe to have run for a quest that
  // then blocks here. Every role other than riftcarver still trips the halt exactly as before.
  const cwdResolution = await questCwdResolveBroker({ questId: quest.id });
  if (cwdResolution.kind === 'missing-worktree' && step?.type !== 'run-riftcarver') {
    await blockOnMissingWorktreeLayerBroker({ quest, worktreePath: cwdResolution.worktreePath });
    activeQuest.clear();
    return null;
  }

  // The dispatcher's turn at the one shared restore step, and the reason the two step-returning
  // exits above are a single one: it fires only when a step is really about to be handed back.
  // Running it unconditionally — the shape the user-resume and startup-recovery triggers take,
  // because each of those fires once per pickup — would put a `git rev-parse` on EVERY scan
  // iteration here, and the MCP long poll scans roughly twice a second for up to 25s per
  // get-next-step call; it could also re-checkout a worktree while an agent is still live inside
  // it. Guarded by a non-null step it runs once per real dispatch and never on an idle spin, and
  // it lands before any agent is spawned, so a drifted worktree can never carry that agent's
  // commits.
  if (step !== null) {
    await worktreeEnsureQuestBranchBroker({
      quest,
      cwdResolution,
      trigger: questResumeTriggerContract.parse('dispatch-scan'),
    });
  }

  activeQuest.setActive({ questId: quest.id });
  return step;
};
