/**
 * PURPOSE: The Start Quest transition, in strict order: the startable gate, the package dependency
 * graph, the relay seed, then approved → in_progress and the queue entry. The ordering is the whole
 * point — the ledger the dispatch loop scans has to exist before the status that makes the quest
 * scannable, and the graph has to exist before the seed, whose derived codeweaver items are ordered
 * off it. Reach for this over questModifyBroker for anything crossing into execution: a bare status
 * write lands an in_progress quest with an empty relay, which the dispatch scan reads as a quest
 * with nothing left to do.
 *
 * Everything here is bookkeeping over quest.json, so the POST answers in milliseconds. The branch,
 * the worktree, the node_modules mirror and the preflight build belong to the `riftcarver` operation
 * item this seeds at the HEAD of the relay, where they stream live into the execution panel and run
 * only once the quest is actually next in line.
 *
 * USAGE:
 * const processId = await OrchestrationStartResponder({ questId });
 * // Returns ProcessId after validating + enqueuing; the dispatch loop drives the relay from here.
 */

import {
  getQuestInputContract,
  modifyQuestInputContract,
  processIdContract,
  questContract,
  questQueueEntryContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';
import {
  isChatWorkItemRoleGuard,
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
import { PrepareQuestPackageGraphLayerResponder } from './prepare-quest-package-graph-layer-responder';

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

  // Sequenced after the startable gate, never before it: a manifest read issued for a Start that
  // the gate then refuses is work done for nothing. The layer reads one `package.json` per declared
  // package and runs Kahn's order over them — milliseconds, so it stays inside the POST. Its own
  // idempotency guard is the packageGraph equivalent of hasExistingRelay below: stamped once, never
  // recomputed while the workspace moves on.
  const packageGraph = await PrepareQuestPackageGraphLayerResponder({ quest });

  const processId = processIdContract.parse(`proc-${crypto.randomUUID()}`);

  // Idempotency: the verify tail is orchestrator-seeded (locked ward items). If it is already on
  // the ledger, a previous Start got as far as the relay seed — don't append it twice; just
  // finish the status transition below.
  const hasExistingRelay = quest.operations.some(
    (operation) => operation.locked && operation.role === 'ward',
  );

  // Mark any non-complete chat work items (chaoswhisperer/glyphsmith/bughunt) as complete. The
  // spec phase is done by the time the user clicks "Begin Quest", but the work item status is
  // never explicitly set to complete during the chat phase.
  const promotedChatItems = quest.workItems.map((wi) =>
    isChatWorkItemRoleGuard({ role: wi.role }) &&
    !isTerminalWorkItemStatusGuard({ status: wi.status })
      ? workItemContract.parse({
          ...wi,
          status: 'complete',
          completedAt: new Date().toISOString(),
        })
      : wi,
  );

  const chatItemIds = quest.workItems
    .filter((wi) => isChatWorkItemRoleGuard({ role: wi.role }))
    .map((wi) => wi.id);

  const now = isoTimestampContract.parse(new Date().toISOString());

  // Hand the relay builder a quest that already carries the freshly derived packageGraph: it orders
  // the derived codeweaver items off that graph, so pre-stamping the quest is what makes the ledger
  // it returns and the graph persisted beside it describe the same layering.
  const relayOverrides = packageGraph === undefined ? {} : { packageGraph };
  const questForRelay =
    Object.keys(relayOverrides).length === 0
      ? quest
      : questContract.parse({ ...quest, ...relayOverrides });
  const promotedChanged = promotedChatItems.some((wi, index) => wi !== quest.workItems[index]);

  if (!hasExistingRelay) {
    // Seed the relay BEFORE the status transition: a crash between the two leaves the quest
    // still `approved` (startable), and the hasExistingRelay check above makes the re-Start
    // skip straight to the transition. The update broker persists operations + the promoted
    // chat items + the package graph + the first work item in ONE atomic write.
    const relay = questBuildRelayGraphBroker({
      quest: questForRelay,
      priorWorkItemIds: chatItemIds,
      now,
    });

    await questOperationsUpdateBroker({
      questId,
      update: () => ({
        operations: relay.operations,
        workItems: [...promotedChatItems, ...relay.workItems],
        ...relayOverrides,
      }),
    });
  } else if (promotedChanged || Object.keys(relayOverrides).length > 0) {
    // A quest whose ledger an earlier Start already seeded (hasExistingRelay) can still be missing
    // the package graph — it must be recorded even when no chat item changed.
    await questOperationsUpdateBroker({
      questId,
      update: () => ({
        workItems: promotedChatItems,
        ...relayOverrides,
      }),
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
