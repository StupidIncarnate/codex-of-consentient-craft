/**
 * PURPOSE: Executes the pathseeker phase — spawns agent, verifies quest, generates work items for next phases
 *
 * USAGE:
 * await runPathseekerLayerBroker({questId, workItem, startPath});
 * // Spawns PathSeeker, verifies quest, creates downstream work items on success
 */

import {
  absoluteFilePathContract,
  type FilePath,
  type QuestId,
  type SessionId,
  type WorkItem,
  workItemContract,
} from '@dungeonmaster/shared/contracts';

import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { verifyQuestInputContract } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { questPathseekerSessionIdTransformer } from '../../../transformers/quest-pathseeker-session-id/quest-pathseeker-session-id-transformer';
import { stepsToWorkItemsTransformer } from '../../../transformers/steps-to-work-items/steps-to-work-items-transformer';
import { agentFilesEnsureBroker } from '../../agent/files-ensure/agent-files-ensure-broker';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questVerifyBroker } from '../verify/quest-verify-broker';
import { questWorkItemInsertBroker } from '../work-item-insert/quest-work-item-insert-broker';

export const runPathseekerLayerBroker = async ({
  questId,
  workItem,
  startPath,
  onAgentEntry,
  abortSignal,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
  onAgentEntry: OnAgentEntryCallback;
  abortSignal: AbortSignal;
}): Promise<void> => {
  // Fetch quest upfront to resolve PathSeeker sessionId and reuse for post-completion paths
  const questInput = getQuestInputContract.parse({ questId });
  const initialQuestResult = await questGetBroker({ input: questInput });
  if (!initialQuestResult.success || !initialQuestResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  // Resolve sessionId: prefer work item's own, fall back to first pathseeker session in quest
  const resolvedSessionId =
    workItem.sessionId ??
    questPathseekerSessionIdTransformer({ workItems: initialQuestResult.quest.workItems });

  const workUnit = workUnitContract.parse({
    role: 'pathseeker',
    questId,
  });

  const slotIndex = slotIndexContract.parse(0);
  let trackedSessionId: SessionId | null = null;

  await agentFilesEnsureBroker({
    targetPath: absoluteFilePathContract.parse(startPath),
  });

  const spawnResult = await agentSpawnByRoleBroker({
    workUnit,
    startPath,
    abortSignal,
    ...(resolvedSessionId === undefined ? {} : { resumeSessionId: resolvedSessionId }),
    onLine: ({ line }: { line: string }) => {
      onAgentEntry({
        slotIndex,
        entry: { raw: line },
        ...(trackedSessionId === null ? {} : { sessionId: trackedSessionId }),
      });
    },
    onSessionId: ({ sessionId }) => {
      trackedSessionId = sessionId;
      questModifyBroker({
        input: {
          questId,
          workItems: [{ id: workItem.id, sessionId }],
        } as ModifyQuestInput,
      }).catch((error: unknown) => {
        process.stderr.write(`[pathseeker] session-id update failed: ${String(error)}\n`);
      });
    },
  });

  const agentSummary = spawnResult.signal?.summary ?? undefined;

  // If aborted (paused), bail out without creating follow-up items
  if (abortSignal.aborted) {
    return;
  }

  // Verify quest
  const verifyInput = verifyQuestInputContract.parse({ questId });
  const verifyResult = await questVerifyBroker({ input: verifyInput });

  const completedAt = new Date().toISOString();

  if (verifyResult.success) {
    // Mark work item complete
    await questModifyBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItem.id,
            status: 'complete',
            completedAt,
            ...(agentSummary === undefined ? {} : { summary: agentSummary }),
          },
        ],
      } as ModifyQuestInput,
    });

    // Generate work items for next phases (codeweaver -> ward -> siege -> law)
    // Re-fetch quest to get steps written by PathSeeker agent
    const postQuestResult = await questGetBroker({ input: questInput });
    if (!postQuestResult.success || !postQuestResult.quest) {
      throw new Error(`Quest not found after pathseeker completion: ${questId}`);
    }
    const now = isoTimestampContract.parse(new Date().toISOString());
    const newItems = stepsToWorkItemsTransformer({
      steps: postQuestResult.quest.steps,
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
          {
            id: workItem.id,
            status: 'failed',
            completedAt,
            errorMessage: 'verification_failed',
            ...(agentSummary === undefined ? {} : { summary: agentSummary }),
          },
        ],
      } as ModifyQuestInput,
    });

    const retryItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'pathseeker',
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: [workItem.id],
      attempt: workItem.attempt + 1,
      maxAttempts: workItem.maxAttempts,
      createdAt: new Date().toISOString(),
      insertedBy: workItem.id,
    });

    const retryQuestResult = await questGetBroker({ input: questInput });
    if (retryQuestResult.success && retryQuestResult.quest) {
      await questWorkItemInsertBroker({
        questId,
        quest: retryQuestResult.quest,
        newWorkItems: [retryItem],
      });
    }
  } else {
    // Max attempts reached — mark failed
    await questModifyBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItem.id,
            status: 'failed',
            completedAt,
            errorMessage: 'verification_failed',
            ...(agentSummary === undefined ? {} : { summary: agentSummary }),
          },
        ],
      } as ModifyQuestInput,
    });
  }
};
