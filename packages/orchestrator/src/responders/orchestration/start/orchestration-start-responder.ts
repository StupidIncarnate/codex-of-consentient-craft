/**
 * PURPOSE: Validates a quest is approved, creates a processId, registers the orchestration process, and launches the quest pipeline fire-and-forget
 *
 * USAGE:
 * const processId = await OrchestrationStartResponder({ questId });
 * // Returns ProcessId after registering process and starting pipeline
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questPipelineLaunchBroker } from '../../../brokers/quest/pipeline-launch/quest-pipeline-launch-broker';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { startableQuestStatusesStatics } from '../../../statics/startable-quest-statuses/startable-quest-statuses-statics';

export const OrchestrationStartResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<ProcessId> => {
  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });

  if (!result.success || !result.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = result;

  const statusAllowed = startableQuestStatusesStatics.some((s) => s === quest.status);
  if (!statusAllowed) {
    throw new Error(`Quest must be approved before starting. Current status: ${quest.status}`);
  }

  const existingProcess = orchestrationProcessesState.findByQuestId({ questId });
  if (existingProcess) {
    return existingProcess.processId;
  }

  const alreadyInProgress = quest.status === 'in_progress';

  const processId = processIdContract.parse(`proc-${crypto.randomUUID()}`);

  orchestrationProcessesState.register({
    orchestrationProcess: {
      processId,
      questId,
      kill: () => undefined,
    },
  });

  if (!alreadyInProgress) {
    const modifyInput = modifyQuestInputContract.parse({ questId, status: 'in_progress' });
    const modifyResult = await questModifyBroker({
      input: modifyInput,
    });

    if (!modifyResult.success) {
      throw new Error(`Failed to transition quest to in_progress: ${modifyResult.error}`);
    }
  }

  questPipelineLaunchBroker({
    processId,
    questId,
    onPhaseChange: () => {
      // Phase tracking removed - derived from quest file in Phase 4
    },
    onAgentEntry: ({ slotIndex, entry }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId,
        payload: { processId, slotIndex, entry },
      });
    },
  }).catch(() => {
    orchestrationProcessesState.remove({ processId });
  });

  return processId;
};
