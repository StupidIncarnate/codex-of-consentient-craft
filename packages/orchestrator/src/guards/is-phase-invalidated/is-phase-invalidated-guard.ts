/**
 * PURPOSE: Checks if a phase's last pass has been invalidated by a more recent prerequisite entry
 *
 * USAGE:
 * isPhaseInvalidatedGuard({executionLog, agentType: 'ward', prerequisiteType: 'codeweaver'});
 * // Returns true if codeweaver ran after ward's last pass
 */

import type { AgentType, ExecutionLogEntry } from '@dungeonmaster/shared/contracts';

export const isPhaseInvalidatedGuard = ({
  executionLog,
  agentType,
  prerequisiteType,
}: {
  executionLog?: readonly ExecutionLogEntry[];
  agentType?: AgentType;
  prerequisiteType?: AgentType;
}): boolean => {
  if (executionLog === undefined || agentType === undefined || prerequisiteType === undefined) {
    return false;
  }

  const lastPass = executionLog
    .filter((entry) => entry.agentType === agentType && entry.status === 'pass')
    .at(-1)?.timestamp;

  if (lastPass === undefined) {
    return false;
  }

  const lastPrereqEntry = executionLog
    .filter((entry) => entry.agentType === prerequisiteType)
    .at(-1)?.timestamp;

  if (lastPrereqEntry === undefined) {
    return false;
  }

  return lastPrereqEntry > lastPass;
};
