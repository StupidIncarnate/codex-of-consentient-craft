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
import { completedCountContract } from '../../../contracts/completed-count/completed-count-contract';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { orchestrationProcessContract } from '../../../contracts/orchestration-process/orchestration-process-contract';
import { totalCountContract } from '../../../contracts/total-count/total-count-contract';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

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

  if (result.quest.status !== 'approved' && result.quest.status !== 'design_approved') {
    throw new Error(
      `Quest must be approved before starting. Current status: ${result.quest.status}`,
    );
  }

  const totalSteps = totalCountContract.parse(result.quest.steps.length);
  const processId = processIdContract.parse(`proc-${crypto.randomUUID()}`);

  const orchestrationProcess = orchestrationProcessContract.parse({
    processId,
    questId,
    process: {
      kill: () => true,
      waitForExit: async () => Promise.resolve(),
    },
    phase: 'idle',
    completedSteps: completedCountContract.parse(0),
    totalSteps,
    startedAt: isoTimestampContract.parse(new Date().toISOString()),
    slots: [],
  });

  orchestrationProcessesState.register({ orchestrationProcess });

  const modifyInput = modifyQuestInputContract.parse({ questId, status: 'in_progress' });
  const modifyResult = await questModifyBroker({
    input: modifyInput,
  });

  if (!modifyResult.success) {
    throw new Error(`Failed to transition quest to in_progress: ${modifyResult.error}`);
  }

  return processId;
};
