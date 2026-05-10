/**
 * PURPOSE: Defines the input schema for the MCP get-agent-prompt tool
 *
 * USAGE:
 * getAgentPromptInputContract.parse({ agent: 'chaoswhisperer-gap-minion' });
 * // Returns validated get-agent-prompt input
 */
import { z } from 'zod';

export const getAgentPromptInputContract = z
  .object({
    agent: z
      .string()
      .min(1)
      .brand<'AgentPromptInputAgent'>()
      .describe('Agent name (e.g. chaoswhisperer-gap-minion, pathseeker-surface-scope-minion)'),
  })
  .strict();

export type GetAgentPromptInput = z.infer<typeof getAgentPromptInputContract>;
