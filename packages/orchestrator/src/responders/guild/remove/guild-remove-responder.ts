/**
 * PURPOSE: Delegates guild removal to the guild-remove broker, then sweeps queue + processes for any quests belonging to the removed guild so the runner doesn't get stuck on stale entries
 *
 * USAGE:
 * await GuildRemoveResponder({ guildId });
 * // Removes the guild from config; quest files are preserved on disk; queue entries and registered processes for this guild are cleaned up.
 */

import type { AdapterResult, GuildId } from '@dungeonmaster/shared/contracts';

import { guildRemoveBroker } from '../../../brokers/guild/remove/guild-remove-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

export const GuildRemoveResponder = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<AdapterResult> => {
  // Capture quest ids belonging to this guild before the queue/process sweep so we can
  // also kill any registered processes — the queue entry alone doesn't carry the kill handle.
  const stranded = questExecutionQueueState
    .getAll()
    .filter((entry) => entry.guildId === guildId)
    .map((entry) => entry.questId);

  for (const questId of stranded) {
    const proc = orchestrationProcessesState.findByQuestId({ questId });
    if (proc !== undefined) {
      orchestrationProcessesState.kill({ processId: proc.processId });
    }
  }
  questExecutionQueueState.removeByGuildId({ guildId });

  return guildRemoveBroker({ guildId });
};
