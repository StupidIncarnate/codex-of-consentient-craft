/**
 * PURPOSE: Delegates guild removal to the guild-remove broker, then sweeps queue + processes for any quests belonging to the removed guild so the runner doesn't get stuck on stale entries
 *
 * USAGE:
 * await GuildRemoveResponder({ guildId });
 * // Removes the guild from config; quest files are preserved on disk; queue entries and registered processes for this guild are cleaned up.
 */

import type { AdapterResult, GuildId, Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { guildRemoveBroker } from '../../../brokers/guild/remove/guild-remove-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

export const GuildRemoveResponder = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<AdapterResult> => {
  // Walk every quest folder under the guild and kill any registered process whose questId
  // matches. The queue-based sweep below only sees quests still on the execution queue —
  // chat-post-exit tail handles re-register on `orchestrationProcessesState` keyed by the
  // chat's resolved questId but never enter the queue, so without this pass every chat
  // session leaks a fs.watch handle for the lifetime of the server. Across an e2e suite
  // (cleanGuilds → DELETE per spec) those handles pile up and eventually starve resume-flow
  // tests of a working tail.
  const guildQuestIds = new Set<QuestId>();
  const guildQuests = await questListBroker({ guildId }).catch(() => [] as Quest[]);
  for (const quest of guildQuests) {
    guildQuestIds.add(quest.id);
  }
  for (const processId of orchestrationProcessesState.getAll()) {
    const proc = orchestrationProcessesState.get({ processId });
    if (proc && guildQuestIds.has(proc.questId)) {
      orchestrationProcessesState.kill({ processId });
    }
  }

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
