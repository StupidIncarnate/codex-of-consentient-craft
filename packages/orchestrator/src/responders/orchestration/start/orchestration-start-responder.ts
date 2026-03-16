/**
 * PURPOSE: Validates a quest is startable, resolves paths, creates a processId, registers the orchestration process, and launches the orchestration loop fire-and-forget
 *
 * USAGE:
 * const processId = await OrchestrationStartResponder({ questId });
 * // Returns ProcessId after registering process and starting orchestration loop
 */

import {
  filePathContract,
  processIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
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

  const abortController = new AbortController();

  orchestrationProcessesState.register({
    orchestrationProcess: {
      processId,
      questId,
      kill: () => {
        abortController.abort();
      },
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

  const hasPathseeker = quest.workItems.some((wi) => wi.role === 'pathseeker');

  if (!hasPathseeker) {
    const chatItemIds = quest.workItems
      .filter(
        (wi) =>
          (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') && wi.status === 'complete',
      )
      .map((wi) => wi.id);

    const pathseekerItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'pathseeker',
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: chatItemIds,
      maxAttempts: 3,
      timeoutMs: slotManagerStatics.pathseeker.timeoutMs,
      createdAt: new Date().toISOString(),
    });

    const insertInput = modifyQuestInputContract.parse({ questId, workItems: [pathseekerItem] });
    await questModifyBroker({ input: insertInput });
  }

  const { guildId } = await questFindQuestPathBroker({ questId });
  const guild = await guildGetBroker({ guildId });
  const startPath = filePathContract.parse(guild.path);

  questOrchestrationLoopBroker({
    processId,
    questId,
    startPath,
    onAgentEntry: ({ slotIndex, entry }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId,
        payload: { processId, slotIndex, entry },
      });
    },
    abortSignal: abortController.signal,
  })
    .then(() => {
      orchestrationProcessesState.remove({ processId });
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `Orchestration loop failed for quest ${questId}: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
      );
      orchestrationProcessesState.remove({ processId });
    });

  return processId;
};
