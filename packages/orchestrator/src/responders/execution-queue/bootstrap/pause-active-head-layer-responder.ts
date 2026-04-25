/**
 * PURPOSE: Layer helper for ExecutionQueueBootstrapResponder — kills the currently-active head quest's running orchestration process when web presence flips false. Does NOT mutate quest status — when presence returns true the queue runner re-picks the same quest from where it left off.
 *
 * USAGE:
 * await PauseActiveHeadLayerResponder({ questId, guildId, status });
 * // Looks up the registered process for the quest and kills it if found. The quest entry
 * // stays in the queue at its current status; the queue runner will resume on the next
 * // presence-true kick. Returns { paused: true } if a process was killed, { paused: false } otherwise.
 *
 * WHY no status mutation: pause-on-presence-false is an internal "stop wasted compute"
 * signal, not a user pause. Mutating quest.status to `paused` raced with fresh enqueues
 * (a presence flip false during the brief window between enqueue + browser-connect would
 * pause a quest that was just started by another test/agent). Keeping status untouched
 * lets the queue runner naturally resume on the next kick.
 */

import type { GuildId, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const PauseActiveHeadLayerResponder = async ({
  questId,
}: {
  questId: QuestId;
  guildId: GuildId;
  status: QuestStatus;
}): Promise<{ paused: boolean }> => {
  await Promise.resolve();
  const existing = orchestrationProcessesState.findByQuestId({ questId });
  if (existing === undefined) {
    return { paused: false };
  }
  orchestrationProcessesState.kill({ processId: existing.processId });
  return { paused: true };
};
