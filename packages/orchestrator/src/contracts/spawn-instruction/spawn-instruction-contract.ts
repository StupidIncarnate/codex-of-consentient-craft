/**
 * PURPOSE: Single agent-dispatch instruction returned inside a NextStep "spawn-agents" payload
 *
 * USAGE:
 * spawnInstructionContract.parse({ questId, role: 'codeweaver', workItemId, taskPrompt });
 * // Returns: SpawnInstruction
 */

import { z } from '#gateway/npm/zod';

import { questContract, workItemContract, sessionContract } from '@dungeonmaster/shared/contracts';

import { agentRoleContract } from '../agent-role/agent-role-contract';
import { claudeModelContract } from '../claude-model/claude-model-contract';

export const spawnInstructionContract = z
  .object({
    questId: questContract.shape.id,
    role: agentRoleContract,
    workItemId: workItemContract.shape.id,
    taskPrompt: z.string().min(1).brand<'SpawnInstructionTaskPrompt'>(),
    model: claudeModelContract.optional(),
    // Set when orphan recovery marked the work item for resume: Node dispatch resumes this Claude
    // session (`claude --resume`) with the resumePrompt instead of fresh-spawning. The MCP/Task
    // dispatcher cannot resume by construction and ignores both, falling back to the fresh
    // taskPrompt — which is why taskPrompt always stays the fresh variant.
    resumeSessionId: sessionContract.shape.id.optional(),
    resumePrompt: z.string().min(1).brand<'SpawnInstructionResumePrompt'>().optional(),
  })
  .brand<'SpawnInstruction'>();

export type SpawnInstruction = z.infer<typeof spawnInstructionContract>;
