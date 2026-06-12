/**
 * PURPOSE: Tests whether an `AgentPromptName` belongs to the parent-summoned minion class
 * (chaoswhisperer-gap-minion, the pathseeker surface/dedup/assertion-correctness minions,
 * codeweaver-minion, blightwarden-*-minion). Minions are summoned by their parent agent via the
 * Agent tool and fetch their served prompt with no work item of their own.
 *
 * USAGE:
 * isMinionAgentPromptNameGuard({ agentName });
 * // Returns true if the name is one of the minion variants (agentPromptClassificationStatics.minionNames)
 */

import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';

export const isMinionAgentPromptNameGuard = ({
  agentName,
}: {
  agentName?: AgentPromptName;
}): boolean => {
  if (agentName === undefined) {
    return false;
  }
  return agentPromptClassificationStatics.minionNames.some(
    (minionName) => minionName === agentName,
  );
};
