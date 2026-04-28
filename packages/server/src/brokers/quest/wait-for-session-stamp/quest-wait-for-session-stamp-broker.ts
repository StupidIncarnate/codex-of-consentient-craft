/**
 * PURPOSE: Polls a quest until its chaoswhisperer/glyphsmith workItem has a sessionId stamped, or until the deadline passes
 *
 * USAGE:
 * const ready = await questWaitForSessionStampBroker({ questId });
 * // Returns the most-recently-loaded Quest. Exits early when no chat-related workItem is
 * // still pending without a sessionId, or when the poll budget elapses.
 *
 * WHEN-TO-USE: subscribe-quest's replay loop, before walking workItems for replay. The
 * new-chat flow stamps sessionId asynchronously after the CLI emits its init line — a
 * subscribe arriving in the ~100ms window between init and persist sees a pending
 * workItem with no sessionId and skips it. Any chat-output emitted before subscribe
 * (no live subscriber) is then unrecoverable. This broker absorbs the race.
 *
 * WHEN-NOT-TO-USE: Quests already in execution phase or terminal (workItems are not
 * pending) — there's nothing to wait for. Bail-out is automatic via the role+status check.
 */

import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { isPendingWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';

const DEFAULT_TOTAL_MS = 200;
const DEFAULT_INTERVAL_MS = 20;

export const questWaitForSessionStampBroker = async ({
  questId,
  current,
  deadline,
  intervalMs,
}: {
  questId: QuestId;
  current?: Quest;
  deadline?: number;
  intervalMs?: number;
}): Promise<Quest> => {
  const interval = intervalMs ?? DEFAULT_INTERVAL_MS;
  const effectiveDeadline = deadline ?? Date.now() + DEFAULT_TOTAL_MS;
  const seed = current ?? (await orchestratorLoadQuestAdapter({ questId }).catch(() => null));
  if (!seed) {
    throw new Error(`questWaitForSessionStampBroker: failed to load quest ${questId}`);
  }
  const stillUnstamped = seed.workItems.some(
    (wi) =>
      (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') &&
      isPendingWorkItemStatusGuard({ status: wi.status }) &&
      wi.sessionId === undefined,
  );
  if (!stillUnstamped) return seed;
  if (Date.now() >= effectiveDeadline) return seed;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, interval);
  });
  const refreshed = await orchestratorLoadQuestAdapter({ questId }).catch(() => seed);
  return questWaitForSessionStampBroker({
    questId,
    current: refreshed,
    deadline: effectiveDeadline,
    intervalMs: interval,
  });
};
