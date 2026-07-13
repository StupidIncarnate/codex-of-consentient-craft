/**
 * PURPOSE: Single agent-dispatch instruction returned inside a NextStep "spawn-agents" payload
 *
 * USAGE:
 * spawnInstructionContract.parse({ questId, role: 'codeweaver', workItemId, taskPrompt });
 * // Returns: SpawnInstruction
 */

import { z } from 'zod';

import {
  questIdContract,
  questWorkItemIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

import { agentRoleContract } from '../agent-role/agent-role-contract';
import { claudeModelContract } from '../claude-model/claude-model-contract';
import { promptTextContract } from '../prompt-text/prompt-text-contract';

export const spawnInstructionContract = z.object({
  questId: questIdContract,
  role: agentRoleContract,
  workItemId: questWorkItemIdContract,
  taskPrompt: promptTextContract,
  model: claudeModelContract.optional(),
  // Set when orphan recovery marked the work item for resume: Node dispatch resumes this Claude
  // session (`claude --resume`) with the resumePrompt instead of fresh-spawning. The MCP/Task
  // dispatcher cannot resume by construction and ignores both, falling back to the fresh
  // taskPrompt — which is why taskPrompt always stays the fresh variant.
  resumeSessionId: sessionIdContract.optional(),
  resumePrompt: promptTextContract.optional(),
});

export type SpawnInstruction = z.infer<typeof spawnInstructionContract>;
