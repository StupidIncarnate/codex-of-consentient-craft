/**
 * PURPOSE: Adapter for questSessionRecordBroker that wraps the orchestrator package. Reach for this
 * over orchestratorModifyQuestAdapter when what you are writing is WHERE a session ran: `sessions`
 * is deliberately absent from `modifyQuestInputContract`, so no agent-facing tool can reach it, and
 * this is the only route the MCP process has to append a row.
 *
 * USAGE:
 * await orchestratorRecordQuestSessionAdapter({ questId, sessionId, cwd, role, workItemId });
 * // Returns AdapterResult, or throws
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import type {
  AbsoluteFilePath,
  AdapterResult,
  QuestId,
  QuestWorkItemId,
  SessionId,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';

export const orchestratorRecordQuestSessionAdapter = async ({
  questId,
  sessionId,
  cwd,
  role,
  workItemId,
}: {
  questId: QuestId;
  sessionId: SessionId;
  cwd: AbsoluteFilePath;
  role: WorkItemRole;
  workItemId?: QuestWorkItemId;
}): Promise<AdapterResult> =>
  StartOrchestrator.recordQuestSession({
    questId,
    sessionId,
    cwd,
    role,
    ...(workItemId === undefined ? {} : { workItemId }),
  });
