/**
 * PURPOSE: Layer helper for questGetNextStepBroker — turns one active quest into the single dispatch
 * decision for it. The load-bearing part is the split it enforces: anything that is NOT a Claude
 * session is returned alone under its own step type, and only what is left is batched as agents,
 * which is what keeps a non-agent role out of buildSpawnInstructionLayerBroker's agentRoleContract
 * parse.
 *
 * USAGE:
 * const step = computeNextStepFromQuestLayerBroker({ quest });
 * // Returns: NextStep | null — null means quest has only in_progress items right now.
 *
 * THE STEP DECIDES BEFORE THE ROLE. A `kind: 'deterministic'` step runs a handler, never a session,
 * and its work item carries the ROLE of the scope it belongs to — a `commit` step inside a
 * codeweaver scope reads `role: 'codeweaver'`. Keying on the role alone would spawn a Claude session
 * for it; keying on the role alone would also send the `repair` step inside `wardFull` (a
 * spiritmender PROMPT) to the ward command path, because that scope's role is `ward`. So the step
 * node is resolved first, and the role-keyed command split below answers only for a work item that
 * runs no step graph at all.
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { nextStepContract, type NextStep } from '../../../contracts/next-step/next-step-contract';
import { workItemStepNodeTransformer } from '../../../transformers/work-item-step-node/work-item-step-node-transformer';
import { buildSpawnInstructionLayerBroker } from './build-spawn-instruction-layer-broker';
import { computeReadyWorkItemsLayerBroker } from './compute-ready-work-items-layer-broker';
import { selectBatchLayerBroker } from './select-batch-layer-broker';

const RIFTCARVER_ROLE = 'riftcarver';

export const computeNextStepFromQuestLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): NextStep | null => {
  const ready = computeReadyWorkItemsLayerBroker({ workItems: quest.workItems });
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

  // A COMMAND work item that runs no step graph — a hydrated quest's ward, a legacy ledger's carve.
  // Each command owns the whole tree for the length of its run, so it is returned alone and BEFORE
  // the batch below, which is what keeps a riftcarver item out of buildSpawnInstructionLayerBroker:
  // that layer parses agentRoleContract and throws for any role Claude cannot be dispatched as.
  const commandItem =
    headNode === undefined
      ? ready.find((item) => isCommandWorkItemRoleGuard({ role: item.role }))
      : undefined;

  if (commandItem !== undefined && commandItem.role === RIFTCARVER_ROLE) {
    return nextStepContract.parse({
      type: 'run-riftcarver',
      questId: quest.id,
      workItemId: commandItem.id,
    });
  }

  if (commandItem !== undefined) {
    return nextStepContract.parse({
      type: 'run-ward',
      questId: quest.id,
      workItemId: commandItem.id,
      mode: commandItem.wardMode ?? 'committed',
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

  const agents = batch.map((workItem) =>
    buildSpawnInstructionLayerBroker({ questId: quest.id, workItem }),
  );
  return nextStepContract.parse({ type: 'spawn-agents', agents });
};
