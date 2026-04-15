/**
 * PURPOSE: Resolves an agent name to its prompt data for the get-agent-prompt MCP tool
 *
 * USAGE:
 * const result = AgentPromptFlow.get({ agent: 'chaoswhisperer-gap-minion' });
 * // Returns { name: 'chaoswhisperer-gap-minion', model: 'sonnet', prompt: '...' }
 */

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import type { AgentPromptResult } from '../../contracts/agent-prompt-result/agent-prompt-result-contract';
import { agentNameToPromptTransformer } from '../../transformers/agent-name-to-prompt/agent-name-to-prompt-transformer';

export const AgentPromptFlow = {
  get: ({ agent }: { agent: string }): AgentPromptResult => {
    const parsed = agentPromptNameContract.parse(agent);
    return agentNameToPromptTransformer({ agent: parsed });
  },
};
