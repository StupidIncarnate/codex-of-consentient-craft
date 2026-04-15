/**
 * PURPOSE: Defines the return shape for agent prompt lookups via the get-agent-prompt MCP tool
 *
 * USAGE:
 * agentPromptResultContract.parse({ name: 'chaoswhisperer-gap-minion', model: 'sonnet', prompt: '...' });
 * // Returns validated AgentPromptResult
 */

import { z } from 'zod';

export const agentPromptResultContract = z.object({
  name: z.string().min(1).brand<'AgentPromptResultName'>(),
  model: z.string().min(1).brand<'AgentPromptResultModel'>(),
  prompt: z.string().min(1).brand<'AgentPromptResultPrompt'>(),
});

export type AgentPromptResult = z.infer<typeof agentPromptResultContract>;
