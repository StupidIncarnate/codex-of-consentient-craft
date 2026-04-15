/**
 * PURPOSE: Resolves an agent prompt name to its prompt result (name, model, prompt text)
 *
 * USAGE:
 * const result = agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('chaoswhisperer-gap-minion') });
 * // Returns { name: 'chaoswhisperer-gap-minion', model: 'sonnet', prompt: '...' }
 */

import {
  agentPromptResultContract,
  type AgentPromptResult,
} from '../../contracts/agent-prompt-result/agent-prompt-result-contract';
import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { pathseekerQuestReviewMinionStatics } from '../../statics/pathseeker-quest-review-minion/pathseeker-quest-review-minion-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { pathseekerSurfaceScopeMinionStatics } from '../../statics/pathseeker-surface-scope-minion/pathseeker-surface-scope-minion-statics';

export const agentNameToPromptTransformer = ({
  agent,
}: {
  agent: AgentPromptName;
}): AgentPromptResult => {
  switch (agent) {
    case 'chaoswhisperer-gap-minion':
      return agentPromptResultContract.parse({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template,
      });
    case 'pathseeker-quest-review-minion':
      return agentPromptResultContract.parse({
        name: 'pathseeker-quest-review-minion',
        model: 'sonnet',
        prompt: pathseekerQuestReviewMinionStatics.prompt.template,
      });
    case 'pathseeker-surface-scope-minion':
      return agentPromptResultContract.parse({
        name: 'pathseeker-surface-scope-minion',
        model: 'sonnet',
        prompt: pathseekerSurfaceScopeMinionStatics.prompt.template,
      });
    default: {
      const exhaustiveCheck: never = agent;
      throw new Error(`Unknown agent: ${String(exhaustiveCheck)}`);
    }
  }
};
