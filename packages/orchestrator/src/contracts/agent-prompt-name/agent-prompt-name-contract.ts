/**
 * PURPOSE: Defines valid agent names for the get-agent-prompt MCP tool
 *
 * USAGE:
 * agentPromptNameContract.parse('quest-gap-reviewer');
 * // Returns: 'quest-gap-reviewer' as AgentPromptName
 */

import { z } from 'zod';

export const agentPromptNameContract = z.enum(['quest-gap-reviewer', 'finalizer-quest-agent']);

export type AgentPromptName = z.infer<typeof agentPromptNameContract>;
