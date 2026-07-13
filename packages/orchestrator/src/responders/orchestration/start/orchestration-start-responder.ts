/**
 * PURPOSE: Validates a quest is startable, promotes chat work items, seeds the operations relay
 * (the quest type's implementation operation items plus the fixed verify tail) with ONE work item
 * for the first actionable operation item, and transitions the quest approved → in_progress so the
 * dispatch loop picks it up. Enqueues it and returns a synthetic processId for backwards
 * compatibility with callers.
 *
 * USAGE:
 * const processId = await OrchestrationStartResponder({ questId });
 * // Returns ProcessId after validating + enqueuing; the dispatch loop drives the relay from here.
 */

import {
  getQuestInputContract,
  modifyQuestInputContract,
  processIdContract,
  questQueueEntryContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';
import {
  isStartableQuestStatusGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { questBuildRelayGraphBroker } from '../../../brokers/quest/build-relay-graph/quest-build-relay-graph-broker';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOperationsUpdateBroker } from '../../../brokers/quest/operations-update/quest-operations-update-broker';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

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

  // Idempotency: the verify tail is orchestrator-seeded (locked ward items). If it is already on
  // the ledger, a previous Start got as far as the relay seed — don't append it twice; just
  // finish the status transition below.
  const hasExistingRelay = quest.operations.some(
    (operation) => operation.locked && operation.role === 'ward',
  );

  // Mark any non-complete chaoswhisperer/glyphsmith work items as complete. The spec phase is
  // done by the time the user clicks "Begin Quest", but the work item status is never explicitly
  // set to complete during the chat phase.
  const promotedChatItems = quest.workItems.map((wi) =>
    (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') &&
    !isTerminalWorkItemStatusGuard({ status: wi.status })
      ? workItemContract.parse({
          ...wi,
          status: 'complete',
          completedAt: new Date().toISOString(),
        })
      : wi,
  );

  const chatItemIds = quest.workItems
    .filter((wi) => wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith')
    .map((wi) => wi.id);

  const now = isoTimestampContract.parse(new Date().toISOString());

  if (!hasExistingRelay) {
    // Seed the relay BEFORE the status transition: a crash between the two leaves the quest
    // still `approved` (startable), and the hasExistingRelay check above makes the re-Start
    // skip straight to the transition. The update broker persists operations + the promoted
    // chat items + the first work item in ONE atomic write.
    const relay = questBuildRelayGraphBroker({
      quest,
      priorWorkItemIds: chatItemIds,
      now,
    });

    await questOperationsUpdateBroker({
      questId,
      update: () => ({
        operations: relay.operations,
        workItems: [...promotedChatItems, ...relay.workItems],
      }),
    });
  } else if (promotedChatItems.some((wi, index) => wi !== quest.workItems[index])) {
    await questOperationsUpdateBroker({
      questId,
      update: () => ({ workItems: promotedChatItems }),
    });
  }

  const promoteResult = await questModifyBroker({
    input: modifyQuestInputContract.parse({
      questId,
      status: 'in_progress',
    }),
  });

  if (!promoteResult.success) {
    throw new Error(`Failed to start quest: ${promoteResult.error}`);
  }

  const { guildId } = await questFindQuestPathBroker({ questId });
  const guild = await guildGetBroker({ guildId });
  const guildSlug = guild.urlSlug ?? nameToUrlSlugTransformer({ name: guild.name });

  // Queue entry uses the quest snapshot from before the transition — callers using this to
  // display the queue re-read the quest through the quest-modified event stream once the modify
  // broker's outbox append fires, so the exact status captured here is cosmetic.
  const entry = questQueueEntryContract.parse({
    questId,
    guildId,
    guildSlug,
    questTitle: quest.title,
    status: quest.status,
    enqueuedAt: new Date().toISOString(),
    ...(quest.questSource === undefined ? {} : { questSource: quest.questSource }),
  });

  // Register the processId so callers can poll /api/process/:processId for status immediately
  // after start. Start spawns nothing, so there is no process to kill — the kill hook must NOT
  // touch the queue entry: pause kills this registration to stop any running work, and the
  // paused quest must STAY queued so resume/dispatch can pick it back up. Queue-entry removal is
  // owned by the sync listener (terminal status / delete).
  orchestrationProcessesState.register({
    orchestrationProcess: {
      processId,
      questId,
      kill: (): void => {
        // No-op — nothing was spawned at start.
      },
    },
  });

  questExecutionQueueState.enqueue({ entry });

  return processId;
};
