/**
 * PURPOSE: Executes the pathseeker phase — spawns agent, verifies quest, generates work items for next phases
 *
 * USAGE:
 * await runPathseekerLayerBroker({questId, workItem, startPath});
 * // Spawns PathSeeker, verifies quest, creates downstream work items on success
 */

import {
  workItemContract,
  type FilePath,
  type QuestId,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { verifyQuestInputContract } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { stepsToWorkItemsTransformer } from '../../../transformers/steps-to-work-items/steps-to-work-items-transformer';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questVerifyBroker } from '../verify/quest-verify-broker';
import { questWorkItemInsertBroker } from '../work-item-insert/quest-work-item-insert-broker';

const PATHSEEKER_TIMEOUT_MS = 600000;

export const runPathseekerLayerBroker = async ({
  questId,
  workItem,
  startPath,
  onAgentEntry,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<void> => {
  const workUnit = workUnitContract.parse({
    role: 'pathseeker',
    questId,
  });

  const slotIndex = slotIndexContract.parse(0);
  const timeoutMs = timeoutMsContract.parse(workItem.timeoutMs ?? PATHSEEKER_TIMEOUT_MS);

  await agentSpawnByRoleBroker({
    workUnit,
    timeoutMs,
    startPath,
    ...(workItem.sessionId === undefined ? {} : { resumeSessionId: workItem.sessionId }),
    ...(onAgentEntry === undefined
      ? {}
      : {
          onLine: ({ line }: { line: string }) => {
            onAgentEntry({ slotIndex, entry: { raw: line } });
          },
        }),
    onSessionId: ({ sessionId }) => {
      void questModifyBroker({
        input: {
          questId,
          workItems: [{ id: workItem.id, sessionId }],
        } as ModifyQuestInput,
      });
    },
  });

  // Verify quest
  const verifyInput = verifyQuestInputContract.parse({ questId });
  const verifyResult = await questVerifyBroker({ input: verifyInput });

  const completedAt = new Date().toISOString();

  if (verifyResult.success) {
    // Mark work item complete
    await questModifyBroker({
      input: {
        questId,
        workItems: [{ id: workItem.id, status: 'complete', completedAt }],
      } as ModifyQuestInput,
    });

    // Generate work items for next phases (codeweaver -> ward -> siege -> law)
    const questInput = getQuestInputContract.parse({ questId });
    const questResult = await questGetBroker({ input: questInput });
    if (!questResult.success || !questResult.quest) {
      throw new Error(`Quest not found after pathseeker completion: ${questId}`);
    }
    const now = isoTimestampContract.parse(new Date().toISOString());
    const newItems = stepsToWorkItemsTransformer({
      steps: questResult.quest.steps,
      pathseekerWorkItemId: workItem.id,
      now,
    });
    if (newItems.length > 0) {
      await questModifyBroker({
        input: {
          questId,
          workItems: newItems,
        } as ModifyQuestInput,
      });
    }
  } else if (workItem.attempt < workItem.maxAttempts - 1) {
    // Mark failed, insert retry
    await questModifyBroker({
      input: {
        questId,
        workItems: [
          { id: workItem.id, status: 'failed', completedAt, errorMessage: 'verification_failed' },
        ],
      } as ModifyQuestInput,
    });

    const retryItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'pathseeker',
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: [],
      attempt: workItem.attempt + 1,
      maxAttempts: workItem.maxAttempts,
      timeoutMs: workItem.timeoutMs ?? PATHSEEKER_TIMEOUT_MS,
      createdAt: new Date().toISOString(),
      insertedBy: workItem.id,
    });

    const questInput = getQuestInputContract.parse({ questId });
    const questResult = await questGetBroker({ input: questInput });
    if (questResult.success && questResult.quest) {
      await questWorkItemInsertBroker({
        questId,
        quest: questResult.quest,
        newWorkItems: [retryItem],
      });
    }
  } else {
    // Max attempts reached — mark failed
    await questModifyBroker({
      input: {
        questId,
        workItems: [
          { id: workItem.id, status: 'failed', completedAt, errorMessage: 'verification_failed' },
        ],
      } as ModifyQuestInput,
    });
  }
};
