/**
 * PURPOSE: Layer helper for ExecutionQueueBootstrapResponder — pauses the currently-active head quest when web presence flips false by delegating to the shared questPauseBroker.
 *
 * USAGE:
 * await PauseActiveHeadLayerResponder({ questId, guildId, status });
 * // Delegates to questPauseBroker which kills the registered subprocess and flips the
 * // quest status to paused with pausedAtStatus=status. Returns { paused: false } when the
 * // quest is missing so the bootstrap can swallow the noop silently.
 */

import type { GuildId, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';

import { questPauseBroker } from '../../../brokers/quest/pause/quest-pause-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const PauseActiveHeadLayerResponder = async ({
  questId,
  guildId,
  status,
}: {
  questId: QuestId;
  guildId: GuildId;
  status: QuestStatus;
}): Promise<{ paused: boolean }> =>
  questPauseBroker({
    questId,
    guildId,
    previousStatus: status,
    processControls: {
      findByQuestId: orchestrationProcessesState.findByQuestId,
      kill: orchestrationProcessesState.kill,
    },
  });
