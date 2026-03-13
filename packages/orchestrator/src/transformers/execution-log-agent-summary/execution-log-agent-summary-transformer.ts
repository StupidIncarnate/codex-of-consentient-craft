/**
 * PURPOSE: Extracts summary data for a specific agent type from the execution log,
 * counting failures only since the last prerequisite phase pass
 *
 * USAGE:
 * executionLogAgentSummaryTransformer({executionLog, agentType: 'ward', resetAfterAgentType: 'codeweaver'});
 * // Returns: {lastEntry, failCount} for the given agent type since last codeweaver pass
 */

import type { AgentType, ExecutionLogEntry } from '@dungeonmaster/shared/contracts';

import { failCountContract } from '../../contracts/fail-count/fail-count-contract';
import type { ExecutionLogAgentSummary } from '../../contracts/execution-log-agent-summary/execution-log-agent-summary-contract';

export const executionLogAgentSummaryTransformer = ({
  executionLog,
  agentType,
  resetAfterAgentType,
}: {
  executionLog: readonly ExecutionLogEntry[];
  agentType: AgentType;
  resetAfterAgentType?: AgentType;
}): ExecutionLogAgentSummary => {
  let resetIndex = -1;

  if (resetAfterAgentType !== undefined) {
    for (let index = executionLog.length - 1; index >= 0; index -= 1) {
      const entry = executionLog[index];
      if (
        entry !== undefined &&
        entry.agentType === resetAfterAgentType &&
        entry.outcome === 'pass'
      ) {
        resetIndex = index;
        break;
      }
    }
  }

  const windowStart = resetIndex === -1 ? 0 : resetIndex + 1;
  const windowedEntries = executionLog.slice(windowStart);

  const agentEntries = windowedEntries.filter((entry) => entry.agentType === agentType);

  const lastEntry = agentEntries.at(-1);
  const failCount = agentEntries.filter((entry) => entry.outcome === 'fail').length;

  return {
    lastEntry,
    failCount: failCountContract.parse(failCount),
  };
};
