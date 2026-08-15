/**
 * PURPOSE: Layer helper for questGetNextStepBroker — turns one active quest into the single dispatch decision for it. The load-bearing part is the split it enforces: a COMMAND work item (ward, riftcarver) is returned alone under its own step type, and only what is left is batched as agents, which is what keeps a non-agent role out of buildSpawnInstructionLayerBroker's agentRoleContract parse.
 *
 * USAGE:
 * const step = computeNextStepFromQuestLayerBroker({ quest });
 * // Returns: NextStep | null — null means quest has only in_progress items right now.
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { nextStepContract, type NextStep } from '../../../contracts/next-step/next-step-contract';
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

  // A COMMAND work item dispatches alone, and the rule is stated once here rather than per role:
  // each command owns the whole tree for the length of its run — riftcarver creates the workspace
  // every later role works in, ward grades it — so batching one alongside an agent would let that
  // agent edit the tree mid-verdict. Which of the two is ready decides the step type; they cannot
  // both be, since riftcarver heads the ledger and ward tails it.
  const commandItem = ready.find((item) => isCommandWorkItemRoleGuard({ role: item.role }));

  if (commandItem !== undefined && commandItem.role === RIFTCARVER_ROLE) {
    // Returned BEFORE the ward branch and before the batch below, which is what keeps a riftcarver
    // item out of buildSpawnInstructionLayerBroker — that layer parses agentRoleContract and throws
    // for any role Claude cannot be dispatched as.
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
      mode: commandItem.wardMode ?? 'changed',
    });
  }

  const batch = selectBatchLayerBroker({ ready });
  if (batch.length === 0) {
    return null;
  }

  const agents = batch.map((workItem) =>
    buildSpawnInstructionLayerBroker({ questId: quest.id, workItem }),
  );
  return nextStepContract.parse({ type: 'spawn-agents', agents });
};
