/**
 * PURPOSE: Recovers active quests for a single guild by launching orchestration loops
 *
 * USAGE:
 * const recoveredIds = await RecoverGuildLayerResponder({guildItem});
 * // Scans guild quests and launches loops for any in recoverable statuses without running processes
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, processIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildListItem, QuestId } from '@dungeonmaster/shared/contracts';

import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { recoverableQuestStatusesStatics } from '../../../statics/recoverable-quest-statuses/recoverable-quest-statuses-statics';

const QUEST_FILE_NAME = 'quest.json';

export const RecoverGuildLayerResponder = async ({
  guildItem,
}: {
  guildItem: GuildListItem;
}): Promise<QuestId[]> => {
  if (!guildItem.valid) {
    return [];
  }

  const recoveredIds: QuestId[] = [];

  try {
    const quests = await questListBroker({ guildId: guildItem.id });
    const guild = await guildGetBroker({ guildId: guildItem.id });
    const startPath = filePathContract.parse(guild.path);

    for (const quest of quests) {
      const isRecoverable = recoverableQuestStatusesStatics.some((s) => s === quest.status);
      if (!isRecoverable) {
        continue;
      }

      const existingProcess = orchestrationProcessesState.findByQuestId({ questId: quest.id });
      if (existingProcess) {
        continue;
      }

      const processId = processIdContract.parse(`proc-recovery-${crypto.randomUUID()}`);
      const abortController = new AbortController();

      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId,
          questId: quest.id,
          kill: () => {
            abortController.abort();
          },
        },
      });

      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [quest.folder, QUEST_FILE_NAME] }),
      );

      questOrchestrationLoopBroker({
        processId,
        questId: quest.id,
        questFilePath,
        startPath,
        abortSignal: abortController.signal,
      })
        .then(() => {
          orchestrationProcessesState.remove({ processId });
        })
        .catch(() => {
          orchestrationProcessesState.remove({ processId });
        });

      recoveredIds.push(quest.id);
    }
  } catch {
    // Guild quest directory may not exist yet
  }

  return recoveredIds;
};
