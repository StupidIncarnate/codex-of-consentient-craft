/**
 * PURPOSE: Single agent-dispatch instruction returned inside a NextStep "spawn-agents" payload
 *
 * USAGE:
 * spawnInstructionContract.parse({ questId, role: 'codeweaver', workItemId, taskPrompt });
 * // Returns: SpawnInstruction
 */

import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

import { agentRoleContract } from '../agent-role/agent-role-contract';
import { claudeModelContract } from '../claude-model/claude-model-contract';
import { promptTextContract } from '../prompt-text/prompt-text-contract';

export const spawnInstructionContract = z.object({
  questId: questIdContract,
  role: agentRoleContract,
  workItemId: questWorkItemIdContract,
  taskPrompt: promptTextContract,
  model: claudeModelContract.optional(),
});

export type SpawnInstruction = z.infer<typeof spawnInstructionContract>;
