/**
 * PURPOSE: The ONE place a row is appended to `quest.sessions`, recording the cwd a session ran in
 * at the moment its `sessionId` is first stamped. Every dispatch surface that learns a sessionId
 * calls this — the node dispatcher, the MCP `get-agent-prompt` identity stamp, and both chat spawn
 * paths — so `sessions` never needs to appear on `modifyQuestInputContract` and no agent can write
 * it. Reach for `questSessionCwdTransformer` to READ a row back; this broker only ever appends one.
 *
 * USAGE:
 * await questSessionRecordBroker({ questId, sessionId, cwd, role, workItemId });
 * // Appends one row, or does nothing when that sessionId already has one
 *
 * WRITTEN ONCE, NEVER REWRITTEN. A sessionId is re-stamped routinely — an orphan-recovery resume, a
 * redelivered MCP fetch, an API-overload retry — and each re-serves a session whose cwd has not
 * moved, so the first row is already right. The existence check lives INSIDE the update callback
 * rather than ahead of it because there is no expensive work out here to skip: returning `null` from
 * the callback is what makes the append idempotent under two racing callers, since the per-quest
 * lock is already held by then and the persist is skipped entirely.
 *
 * IT THROWS, and every caller is fire-and-forget. Recording where a session ran is never the subject
 * of the call that learned the sessionId, so a dispatch must not die for it — each stamp site wraps
 * this in a `.catch` that writes to stderr, exactly as it already does for the sessionId stamp
 * itself.
 */

import { adapterResultContract, questSessionContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  AdapterResult,
  QuestId,
  QuestWorkItemId,
  SessionId,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';

import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';

export const questSessionRecordBroker = async ({
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
}): Promise<AdapterResult> => {
  await questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      const alreadyRecorded = quest.sessions.some((row) => row.sessionId === sessionId);

      if (alreadyRecorded) {
        return null;
      }

      return {
        sessions: [
          ...quest.sessions,
          questSessionContract.parse({
            sessionId,
            cwd,
            role,
            ...(workItemId === undefined ? {} : { workItemId }),
            startedAt: new Date().toISOString(),
          }),
        ],
      };
    },
  });

  return adapterResultContract.parse({ success: true });
};
