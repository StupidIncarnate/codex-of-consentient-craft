/**
 * PURPOSE: Serves the session-cwd append to callers OUTSIDE this process — the MCP child, which is
 * the only place that knows a `/dumpster-launch` session's real working directory. Reach for
 * `questSessionRecordBroker` directly from anywhere inside the orchestrator; this exists only so
 * `StartOrchestrator` has a flow to route through, since startup files may not import brokers.
 *
 * USAGE:
 * await QuestRecordSessionResponder({ questId, sessionId, cwd, role, workItemId });
 * // Returns AdapterResult once the row is appended, or was already there
 */

import type {
  AbsoluteFilePath,
  AdapterResult,
  QuestId,
  QuestWorkItemId,
  SessionId,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';

import { questSessionRecordBroker } from '../../../brokers/quest/session-record/quest-session-record-broker';

export const QuestRecordSessionResponder = async ({
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
  questSessionRecordBroker({
    questId,
    sessionId,
    cwd,
    role,
    ...(workItemId === undefined ? {} : { workItemId }),
  });
