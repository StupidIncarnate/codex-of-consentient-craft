/**
 * PURPOSE: Classifies agent prompt names by dispatch surface — `minion` names are dispatched
 * by parent agents (ChaosWhisperer or Blightwarden) via the Agent tool and receive a minimal
 * "Quest ID + Work Item ID" $ARGUMENTS substitution; `role` names map to AgentRole work-unit
 * shapes dispatched by `/dumpster-launch`.
 *
 * USAGE:
 * agentPromptClassificationStatics.minionNames.includes(name);
 * // Returns true if the agent prompt name is a parent-dispatched minion.
 */

export const agentPromptClassificationStatics = {
  minionNames: [
    'chaoswhisperer-gap-minion',
    'blightwarden-security-minion',
    'blightwarden-dedup-minion',
    'blightwarden-perf-minion',
    'blightwarden-integrity-minion',
    'blightwarden-dead-code-minion',
  ],
} as const;
