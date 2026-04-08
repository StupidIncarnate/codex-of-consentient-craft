/**
 * PURPOSE: Resolves an agent prompt name to its prompt result (name, model, prompt text)
 *
 * USAGE:
 * const result = agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('quest-gap-reviewer') });
 * // Returns { name: 'quest-gap-reviewer', model: 'sonnet', prompt: '...' }
 */

import {
  agentPromptResultContract,
  type AgentPromptResult,
} from '../../contracts/agent-prompt-result/agent-prompt-result-contract';
import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { finalizerQuestAgentPromptStatics } from '../../statics/finalizer-quest-agent-prompt/finalizer-quest-agent-prompt-statics';
import { gapReviewerAgentPromptStatics } from '../../statics/gap-reviewer-agent-prompt/gap-reviewer-agent-prompt-statics';

export const agentNameToPromptTransformer = ({
  agent,
}: {
  agent: AgentPromptName;
}): AgentPromptResult => {
  switch (agent) {
    case 'quest-gap-reviewer':
      return agentPromptResultContract.parse({
        name: 'quest-gap-reviewer',
        model: 'sonnet',
        prompt: gapReviewerAgentPromptStatics.prompt.template,
      });
    case 'finalizer-quest-agent':
      return agentPromptResultContract.parse({
        name: 'finalizer-quest-agent',
        model: 'sonnet',
        prompt: finalizerQuestAgentPromptStatics.prompt.template,
      });
    default: {
      const exhaustiveCheck: never = agent;
      throw new Error(`Unknown agent: ${String(exhaustiveCheck)}`);
    }
  }
};
