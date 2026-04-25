/**
 * PURPOSE: Validates a quest is startable, promotes chat work items, inserts a pathseeker, transitions the quest to seek_scope, then enqueues it on the cross-guild quest execution queue. Returns a synthetic processId for backwards compatibility with callers.
 *
 * USAGE:
 * const processId = await OrchestrationStartResponder({ questId });
 * // Returns ProcessId after validating + enqueuing; the queue runner drives the loop when the head is eligible.
 */

import {
  processIdContract,
  questQueueEntryContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import {
  isStartableQuestStatusGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

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

  if (!isStartableQuestStatusGuard({ status: quest.status })) {
    const startableStatuses = Object.entries(questStatusMetadataStatics.statuses)
      .filter(([, meta]) => meta.isStartable)
      .map(([statusName]) => statusName);
    throw new Error(
      `Quest must be in a startable status (${startableStatuses.join(' or ')}). Current status: ${quest.status}`,
    );
  }

  const processId = processIdContract.parse(`proc-${crypto.randomUUID()}`);

  const hasPathseeker = quest.workItems.some((wi) => wi.role === 'pathseeker');

  // Mark any non-complete chaoswhisperer/glyphsmith work items as complete.
  // The spec phase is done by the time the user clicks "Begin Quest", but the
  // work item status is never explicitly set to complete during the chat phase.
  const promotedChatItems = quest.workItems
    .filter(
      (wi) =>
        (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') &&
        !isTerminalWorkItemStatusGuard({ status: wi.status }),
    )
    .map((wi) =>
      workItemContract.parse({
        ...wi,
        status: 'complete',
        completedAt: new Date().toISOString(),
      }),
    );

  const chatItemIds = quest.workItems
    .filter((wi) => wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith')
    .map((wi) => wi.id);

  const pathseekerItem = hasPathseeker
    ? undefined
    : workItemContract.parse({
        id: crypto.randomUUID(),
        role: 'pathseeker',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: chatItemIds,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
      });

  const workItemsToUpdate = [
    ...promotedChatItems,
    ...(pathseekerItem === undefined ? [] : [pathseekerItem]),
  ];

  const modifyInput = modifyQuestInputContract.parse({
    questId,
    status: 'seek_scope',
    ...(workItemsToUpdate.length > 0 ? { workItems: workItemsToUpdate } : {}),
  });

  const modifyResult = await questModifyBroker({ input: modifyInput });

  if (!modifyResult.success) {
    throw new Error(`Failed to start quest: ${modifyResult.error}`);
  }

  const { guildId } = await questFindQuestPathBroker({ questId });
  const guild = await guildGetBroker({ guildId });
  const guildSlug = guild.urlSlug ?? nameToUrlSlugTransformer({ name: guild.name });

  // Queue entry uses the quest snapshot from before the seek_scope transition — callers using
  // this to display the queue will re-read the quest through the quest-modified event stream
  // once the modify broker's outbox append fires, so the exact status captured here is
  // cosmetic (the runner consults the live quest status, not this snapshot, when driving the loop).
  const entry = questQueueEntryContract.parse({
    questId,
    guildId,
    guildSlug,
    questTitle: quest.title,
    status: quest.status,
    enqueuedAt: new Date().toISOString(),
    ...(quest.questSource === undefined ? {} : { questSource: quest.questSource }),
  });

  // Register the processId so callers can poll /api/process/:processId for status
  // immediately after start. The queue runner picks the quest up later and registers
  // its own running-loop process under the same questId; that registration overrides
  // this entry so kill/abandon flows hit the live AbortController.
  orchestrationProcessesState.register({
    orchestrationProcess: {
      processId,
      questId,
      kill: (): void => {
        questExecutionQueueState.removeByQuestId({ questId });
      },
    },
  });

  questExecutionQueueState.enqueue({ entry });

  return processId;
};
