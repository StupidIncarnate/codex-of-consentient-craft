/**
 * PURPOSE: Tests whether an `AgentPromptName` belongs to the parent-dispatched minion class
 * (chaoswhisperer-gap-minion, blightwarden-*-minion). Minions are dispatched by their parent
 * agent via the Agent tool and receive a minimal "Quest ID + Work Item ID" $ARGUMENTS, not a
 * full WorkUnit substitution.
 *
 * USAGE:
 * isMinionAgentPromptNameGuard({ agentName });
 * // Returns true if the name is one of the 6 minion variants
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
