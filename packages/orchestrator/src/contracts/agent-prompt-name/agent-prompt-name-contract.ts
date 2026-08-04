/**
 * PURPOSE: Defines valid agent names for the get-agent-prompt MCP tool
 *
 * USAGE:
 * agentPromptNameContract.parse('chaoswhisperer-gap-minion');
 * // Returns: 'chaoswhisperer-gap-minion' as AgentPromptName
 */

import { z } from 'zod';

import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';

export const agentPromptNameContract = z.enum(agentPromptClassificationStatics.promptNames);

export type AgentPromptName = z.infer<typeof agentPromptNameContract>;
