/**
 * PURPOSE: Accepts any non-empty agent prompt name for the get-agent-prompt MCP tool. Prompts are
 * config that gets swapped in and out, so this stays an OPEN string rather than a closed enum built
 * off the roster — a quest that ran under a prompt name since renamed still has to LOAD. Only
 * DISPATCH refuses an unknown name: `agentNameToPromptTransformer` checks a parsed name against
 * `agentPromptClassificationStatics.promptNames` at that point and throws, naming it.
 *
 * USAGE:
 * agentPromptNameContract.parse('chaoswhisperer-gap-minion');
 * // Returns: 'chaoswhisperer-gap-minion' as AgentPromptName
 */

import { z } from 'zod';

export const agentPromptNameContract = z.string().min(1).brand<'AgentPromptName'>();

export type AgentPromptName = z.infer<typeof agentPromptNameContract>;
