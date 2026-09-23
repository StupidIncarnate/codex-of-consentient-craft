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
import { laneProvisionBatchBroker } from '../../lane/provision-batch/lane-provision-batch-broker';
import { worktreeEnsureQuestBranchBroker } from '../../worktree/ensure-quest-branch/worktree-ensure-quest-branch-broker';
import { questActiveQuestsBroker } from '../active-quests/quest-active-quests-broker';
import { questAdvanceBroker } from '../advance/quest-advance-broker';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questRouteScopeBroker } from '../route-scope/quest-route-scope-broker';
import { blockOnMissingWorktreeLayerBroker } from './block-on-missing-worktree-layer-broker';
import { computeNextStepFromQuestLayerBroker } from './compute-next-step-from-quest-layer-broker';
import { questHasIncompleteWorkLayerBroker } from './quest-has-incomplete-work-layer-broker';
import { recoverOrphanedWorkItemsLayerBroker } from './recover-orphaned-work-items-layer-broker';

const RIFTCARVER_HANDLER = 'riftcarver';

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
  //      BEFORE the router considers minting anything new.
  //   3. the ROUTER — a scope is in flight and its step has drained, so the family graph decides
  //      what that scope does next: mint the next step's batch, complete the scope and mint the
  //      next family's, or HALT. This is where a step that folded to `wall` becomes a blocked
  //      quest, and it is the only route to that halt now.
  //   4. advance self-heal (LAST resort) — no dispatchable work item exists at all, but the
  //      ledger has an actionable operation item: a server stop between the last persist and
  //      questAdvanceBroker left the relay without its next work item. Advance enters that scope
  //      (idempotent, resume-guarded), then recompute from a fresh read.
  // All four run BEFORE the worktree gate below, because that gate's answer depends on which step
  // this quest actually lands on, and a null step is not yet an answer — it is the input to the
  // resolutions underneath it.
  let step = computeNextStepFromQuestLayerBroker({ quest });
  // Tracks whichever quest object actually PRODUCED `step` — the original read, or a recovered,
  // rerouted, or advance-refreshed copy from one of the branches below. The lane broker looks
  // work items up by id off this quest, and a copy whose `workItems` does not carry the id `step`
  // named would answer as if the item were not `needsLane` at all.
  let questForStep = quest;

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
    questForStep = recovery.quest;
  }

  if (step === null) {
    const routing = await questRouteScopeBroker({ questId: quest.id });

    // The router routed a step to `@blocked` — an environment wall, a spent `maxVisits`, an
    // outcome with neither a route nor a minter — and the halt has already landed. Stop for the
    // same reason orphan recovery's does: everything below would act on a quest that just stopped.
    if (routing.blocked) {
      activeQuest.clear();
      return null;
    }

    if (routing.routed) {
      const rerouted = await questGetBroker({
        input: getQuestInputContract.parse({ questId: quest.id }),
      });
      step =
        rerouted.success && rerouted.quest
          ? computeNextStepFromQuestLayerBroker({ quest: rerouted.quest })
          : null;
      if (rerouted.success && rerouted.quest) {
        questForStep = rerouted.quest;
      }
    }
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
    if (refreshed.success && refreshed.quest) {
      questForStep = refreshed.quest;
    }
  }

  // A `spawn-agents` step whose batch `needsLane` gets the ROUTER's lane lifecycle here, before
  // anything is handed back to either dispatcher: bounded by `siegelense capacity`'s `suggested`
  // reading, and a lane started + recorded onto `payload.instance` for each surviving item. Uses
  // `questForStep`, never a fresh read — `step` may have been resolved against a recovered,
  // rerouted, or advance-minted copy whose `workItems` the original `quest` binding does not
  // carry, and the lane broker looks work items up by id off whatever quest it is handed.
  if (step !== null && step.type === 'spawn-agents') {
    step = await laneProvisionBatchBroker({ quest: questForStep, step });
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
  // blocked by the one step that could have fixed it. And a re-carve whose work item was never
  // minted (a crash between the previous carve's ledger write and its advance call) arrives here as
  // a NULL step, so a gate placed above the self-heal would block before the self-heal could mint
  // that work item — and every resume would re-run the identical sequence. Nothing above this point
  // dispatches anything: orphan recovery only flips an `in_progress` work item back to `pending`,
  // and advance only mints a work item on the ledger. Both are safe to have run for a quest that
  // then blocks here. Every role other than riftcarver still trips the halt exactly as before.
  //
  // WHAT LETS RIFTCARVER THROUGH IS THE HANDLER, not a role-keyed step type. The carve is a
  // deterministic step in the `riftcarver` family, so it always arrives as `run-step` carrying
  // `handler: 'riftcarver'` — `NextStep` carries no other member a step-less command item could
  // have returned instead.
  const cwdResolution = await questCwdResolveBroker({ questId: quest.id });
  const carvesTheWorktree = step?.type === 'run-step' && step.handler === RIFTCARVER_HANDLER;

  if (cwdResolution.kind === 'missing-worktree' && !carvesTheWorktree) {
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
