/**
 * PURPOSE: Defines the input schema for the MCP get-agent-prompt tool
 *
 * USAGE:
 * getAgentPromptInputContract.parse({ agent: 'quest-gap-reviewer' });
 * // Returns validated get-agent-prompt input
 */
import { z } from 'zod';

export const getAgentPromptInputContract = z.object({
  agent: z
    .string()
    .min(1)
    .brand<'AgentPromptInputAgent'>()
    .describe('Agent name (e.g. quest-gap-reviewer, finalizer-quest-agent)'),
});

export type GetAgentPromptInput = z.infer<typeof getAgentPromptInputContract>;
