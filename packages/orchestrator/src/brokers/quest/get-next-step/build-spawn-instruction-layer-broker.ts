/**
 * PURPOSE: Layer helper for questGetNextStepBroker — converts a single WorkItem + its quest's id into a fully-formed SpawnInstruction, parsing the work-item role into an AgentRole and interpolating the taskPrompt template
 *
 * USAGE:
 * const instruction = buildSpawnInstructionLayerBroker({ questId, workItem });
 * // Returns: SpawnInstruction — ready to embed in a NextStep spawn-agents response
 */

import type { QuestId, WorkItem } from '@dungeonmaster/shared/contracts';

import {
  agentRoleContract,
  type AgentRole,
} from '../../../contracts/agent-role/agent-role-contract';
import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { buildTaskPromptLayerBroker } from './build-task-prompt-layer-broker';

export const buildSpawnInstructionLayerBroker = ({
  questId,
  workItem,
}: {
  questId: QuestId;
  workItem: WorkItem;
}): SpawnInstruction => {
  const role: AgentRole = agentRoleContract.parse(workItem.role);
  return {
    questId,
    role,
    workItemId: workItem.id,
    taskPrompt: buildTaskPromptLayerBroker({
      role,
      workItemId: workItem.id,
      questId,
    }),
  };
};
