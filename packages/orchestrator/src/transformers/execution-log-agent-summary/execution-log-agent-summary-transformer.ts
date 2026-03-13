/**
 * PURPOSE: Extracts summary data for a specific agent type from the execution log
 *
 * USAGE:
 * executionLogAgentSummaryTransformer({executionLog, agentType: 'ward'});
 * // Returns: {lastEntry, failCount} for the given agent type
 */

import type { AgentType, ExecutionLogEntry } from '@dungeonmaster/shared/contracts';

import { failCountContract } from '../../contracts/fail-count/fail-count-contract';
import type { ExecutionLogAgentSummary } from '../../contracts/execution-log-agent-summary/execution-log-agent-summary-contract';

export const executionLogAgentSummaryTransformer = ({
  executionLog,
  agentType,
}: {
  executionLog: readonly ExecutionLogEntry[];
  agentType: AgentType;
}): ExecutionLogAgentSummary => {
  const entries = executionLog.filter((entry) => entry.agentType === agentType);

  return {
    lastEntry: entries.at(-1),
    failCount: failCountContract.parse(entries.filter((entry) => entry.status === 'fail').length),
  };
};
