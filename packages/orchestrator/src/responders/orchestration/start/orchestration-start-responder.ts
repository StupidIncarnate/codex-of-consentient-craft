/**
 * PURPOSE: Validates a quest is startable, promotes chat work items, inserts the single `pathseeker` planning work item built from `quest.packagesAffected[]` (PathSeeker classifies scope, summons surface + cleanup minions as sub-agents, then runs the architect-review walk itself), persists scopeClassification.slices[] into planningNotes, and leaves a PathSeeker-planned quest RESTING at seek_scope (PathSeeker drives the seek_scope → in_progress completeness gate itself); bug-hunt and already-planned quests promote straight to in_progress so the dispatch loop advances. Enqueues it and returns a synthetic processId for backwards compatibility with callers.
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
import type { ProcessId, QuestId, WorkItem, WorkItemRole } from '@dungeonmaster/shared/contracts';
import {
  questStatusMetadataStatics,
  questTypeRegistryStatics,
} from '@dungeonmaster/shared/statics';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { PathseekerGraph } from '../../../contracts/pathseeker-graph/pathseeker-graph-contract';
import { questBuildBugHuntGraphBroker } from '../../../brokers/quest/build-bug-hunt-graph/quest-build-bug-hunt-graph-broker';
import { questBuildPathseekerGraphBroker } from '../../../brokers/quest/build-pathseeker-graph/quest-build-pathseeker-graph-broker';
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

const PATHSEEKER_ROLES: ReadonlySet<WorkItemRole> = new Set<WorkItemRole>([
  'pathseeker',
  'pathseeker-surface',
  'pathseeker-dedup',
  'pathseeker-assertion-correctness',
  'pathseeker-walk',
]);

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

  // The quest type selects which work-item graph seeds at Start. The registry holds the
  // discriminator (data); the builder choice lives here (the responder may import brokers).
  const { startGraphKind } = questTypeRegistryStatics[quest.questType];

  const hasExistingGraph =
    startGraphKind === 'bug-hunt'
      ? quest.workItems.some((wi) => wi.role === 'pesteater')
      : quest.workItems.some((wi) => PATHSEEKER_ROLES.has(wi.role));

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

  const now = isoTimestampContract.parse(new Date().toISOString());

  // Feature quests seed the PathSeeker graph (and later persist scopeClassification). Bug-hunt
  // quests seed the full pesteater → ward → lawbringer → blightwarden → ward chain at once —
  // there is no PathSeeker, so pathseekerGraph stays undefined and the scopeClassification write
  // below is skipped.
  const pathseekerGraph: PathseekerGraph | undefined =
    hasExistingGraph || startGraphKind === 'bug-hunt'
      ? undefined
      : questBuildPathseekerGraphBroker({
          packagesAffected: quest.packagesAffected,
          flowIds: [],
          priorWorkItemIds: chatItemIds,
          now,
        });

  const newExecutionWorkItems: WorkItem[] = hasExistingGraph
    ? []
    : startGraphKind === 'bug-hunt'
      ? questBuildBugHuntGraphBroker({ priorWorkItemIds: chatItemIds, now })
      : (pathseekerGraph?.workItems ?? []);

  const workItemsToUpdate = [...promotedChatItems, ...newExecutionWorkItems];

  // A PathSeeker-planned feature quest RESTS at seek_scope: PathSeeker runs there and drives the
  // seek_scope → in_progress transition itself (the retryable completeness gate). This is true
  // whenever the quest will have a non-terminal `pathseeker` work item to run. Bug-hunt quests
  // (no PathSeeker) and quests whose planning is already complete instead promote straight to
  // in_progress so the dispatch loop advances the execution chain.
  const willRunPathseeker =
    startGraphKind !== 'bug-hunt' &&
    [...quest.workItems, ...newExecutionWorkItems].some(
      (wi) => wi.role === 'pathseeker' && !isTerminalWorkItemStatusGuard({ status: wi.status }),
    );

  // Transition the quest so each modify call lands within an allowlist window that permits the
  // fields it writes:
  //   1. approved → seek_scope, carrying workItems (server-only field that bypasses the
  //      input-allowlist gate). `approved` cannot reach `in_progress` directly (the transitions
  //      allowlist routes startable statuses through `seek_scope`), and the `approved` allowlist
  //      forbids `planningNotes`, so this hop is required to unlock the scope-seed write below.
  //   2. (when a fresh pathseeker graph was built) modify in `seek_scope` to persist
  //      `planningNotes.scopeClassification` — `seek_scope` is the canonical scope-seed window.
  //   3. seek_scope → in_progress ONLY when no PathSeeker will run (`willRunPathseeker` false:
  //      bug-hunt, or planning already complete). A PathSeeker-planned quest RESTS at seek_scope
  //      instead — the dispatch filter includes pathseeker-running statuses, so the pathseeker
  //      work item dispatches there, and PathSeeker drives seek_scope → in_progress itself (the
  //      completeness gate). Promoting here would starve that gate.
  const modifyInput = modifyQuestInputContract.parse({
    questId,
    status: 'seek_scope',
    ...(workItemsToUpdate.length > 0 ? { workItems: workItemsToUpdate } : {}),
  });

  const modifyResult = await questModifyBroker({ input: modifyInput });

  if (!modifyResult.success) {
    throw new Error(`Failed to start quest: ${modifyResult.error}`);
  }

  if (pathseekerGraph !== undefined) {
    const planningNotesResult = await questModifyBroker({
      input: modifyQuestInputContract.parse({
        questId,
        planningNotes: {
          scopeClassification: {
            size: pathseekerGraph.slices.length > 1 ? 'medium' : 'small',
            slicing: `Auto-generated from quest.packagesAffected (${pathseekerGraph.slices.length} slice(s))`,
            slices: pathseekerGraph.slices,
            rationale:
              'Slices derived 1:1 from quest.packagesAffected by orchestration-start-responder.',
            classifiedAt: now,
          },
        },
      }),
    });

    if (!planningNotesResult.success) {
      throw new Error(`Failed to start quest: ${planningNotesResult.error}`);
    }
  }

  if (!willRunPathseeker) {
    const promoteResult = await questModifyBroker({
      input: modifyQuestInputContract.parse({
        questId,
        status: 'in_progress',
      }),
    });

    if (!promoteResult.success) {
      throw new Error(`Failed to start quest: ${promoteResult.error}`);
    }
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
  // immediately after start. Start spawns nothing, so there is no process to kill — the
  // kill hook must NOT touch the queue entry: pause kills this registration to stop any
  // running work, and the paused quest must STAY queued so resume/dispatch can pick it
  // back up. Queue-entry removal is owned by the sync listener (terminal status / delete).
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
