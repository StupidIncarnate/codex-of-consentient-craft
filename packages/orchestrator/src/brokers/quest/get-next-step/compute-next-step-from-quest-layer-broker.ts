/**
 * PURPOSE: Layer helper for questGetNextStepBroker — turns one active quest into the single dispatch
 * decision for it.
 *
 * USAGE:
 * const step = computeNextStepFromQuestLayerBroker({ quest });
 * // Returns: NextStep | null — null means quest has only in_progress items right now.
 *
 * THE STEP DECIDES BEFORE THE ROLE. A `kind: 'deterministic'` step runs a handler, never a session,
 * and its work item carries the ROLE of the scope it belongs to — a `commit` step inside a
 * codeweaver scope reads `role: 'codeweaver'`. Every family whose role is a COMMAND role (`ward`,
 * `riftcarver`) runs that role through a deterministic step of its own — riftcarver's `carve`,
 * wardFull's `gate` — so the branch below always catches it.
 *
 * A COMMAND-role work item with no step node is unreachable in production: nothing mints that shape
 * any more. It is filtered out of readiness rather than reaching
 * buildSpawnInstructionLayerBroker, whose agentRoleContract parse throws for any role Claude cannot
 * be dispatched as — scanOnceLayerBroker has no per-quest try/catch, so a throw here would take
 * down the scan for every active quest, not just this one.
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { nextStepContract, type NextStep } from '../../../contracts/next-step/next-step-contract';
import { workItemStepNodeTransformer } from '../../../transformers/work-item-step-node/work-item-step-node-transformer';
import { buildSpawnInstructionLayerBroker } from './build-spawn-instruction-layer-broker';
import { computeReadyWorkItemsLayerBroker } from './compute-ready-work-items-layer-broker';
import { selectBatchLayerBroker } from './select-batch-layer-broker';

export const computeNextStepFromQuestLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): NextStep | null => {
  const ready = computeReadyWorkItemsLayerBroker({ workItems: quest.workItems }).filter(
    (item) =>
      !isCommandWorkItemRoleGuard({ role: item.role }) ||
      workItemStepNodeTransformer({ quest, workItem: item }) !== undefined,
  );
  if (ready.length === 0) {
    return null;
  }

  const [head] = ready;
  if (head === undefined) {
    return null;
  }

  const headNode = workItemStepNodeTransformer({ quest, workItem: head });

  // A DETERMINISTIC step dispatches ALONE, for the reason a command always has: it owns the whole
  // tree for the length of its run — `commit` takes git's index lock, `ward` grades the tree,
  // `cleanup` kills every siegelense instance — so batching one beside an agent would let that agent
  // edit the tree mid-run.
  if (headNode?.kind === 'deterministic' && headNode.handler !== undefined) {
    return nextStepContract.parse({
      type: 'run-step',
      questId: quest.id,
      workItemId: head.id,
      handler: headNode.handler,
      args: headNode.args ?? [],
    });
  }

  // ONE STEP'S BATCH, not every ready id. A router batch is one step of one family by construction,
  // and `ready` spans every scope the relay has open — two codeweaver cells legitimately sit at
  // different steps at once. Selecting by the head's role AND step is that batch read back off the
  // ledger, which is where the router persisted it; handing the selector everything instead is what
  // made its mixed-step throw reachable from ordinary traffic.
  const selected = ready
    .filter((item) => item.role === head.role && String(item.step) === String(head.step))
    .map((item) => item.id);

  const batch = selectBatchLayerBroker({ ready, selected });
  if (batch.length === 0) {
    return null;
  }

  const agents = batch.map((workItem) => buildSpawnInstructionLayerBroker({ quest, workItem }));
  return nextStepContract.parse({ type: 'spawn-agents', agents });
};
