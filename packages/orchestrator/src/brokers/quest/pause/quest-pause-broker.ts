/**
 * PURPOSE: Shared pause logic — kills every registered orchestration subprocess for a quest, then
 * resets its active work items to pending and flips quest status to paused (pre-pause status
 * captured in pausedAtStatus) in ONE quest.json read-modify-write taken inside
 * questWithModifyLockBroker's own per-quest lock. The read that decides which work items are
 * "active" and the write that persists the reset happen in the SAME lock turn, so no concurrent
 * writer racing that lock — another pause, spawn-batch-layer-broker's async re-stamp after a resume
 * — can land between the decision and the persist. A quest carries more than one process
 * registration at once (Start's quest-level entry alongside each spawned agent's), so stopping at
 * the first one leaves a live agent behind on a quest the user has paused.
 *
 * USAGE:
 * const result = await questPauseBroker({
 *   questId,
 *   previousStatus: 'in_progress',
 *   processControls: { findAllByQuestId, kill },
 * });
 * // Returns { paused: true } on a successful pause, and also on a redundant pause of an
 * // already-paused quest (idempotent no-op). Returns { paused: false } when the quest is missing
 * // or the transition is invalid.
 *
 * WHY processControls is a parameter: brokers cannot import from state/, so the caller
 * (responder) supplies the real `orchestrationProcessesState` methods; tests inject jest mocks.
 *
 * WHY THIS BROKER LOADS + PERSISTS DIRECTLY INSTEAD OF CALLING questModifyBroker: entering
 * questModifyBroker's lock from inside a lock this broker already holds for the same questId would
 * deadlock (questWithModifyLockBroker is deliberately non-reentrant per its own header), and closing
 * the race requires the "which items are active" decision and the write to share ONE lock turn. The
 * slice of questModifyBroker's pipeline pause actually needs — the transition-validity guard, then
 * the persist — is reproduced directly here. The per-status input allowlist and the save-time
 * invariants are agent-authored-payload concerns that do not apply to this server-owned write,
 * exactly as questOperationsUpdateBroker (ward/riftcarver/advance) already bypasses them; the
 * gate-content guard is skipped too, since `paused` names no entry in
 * questGateContentRequirementsStatics.gates and so always passes it trivially.
 *
 * WHY THE OUTER TRY/CATCH: this domain's brokers (questGetBroker, questModifyBroker) never throw —
 * they resolve a typed success/failure shape, and orchestration-pause-responder relies on
 * questPauseBroker following the same contract (`if (!result.paused) throw`). questFindQuestPathBroker
 * throws on a missing quest, so that throw is caught here and converted to { paused: false } rather
 * than propagated, preserving the contract every caller of this broker already depends on.
 */

import type { GuildId, ProcessId, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';
import {
  fileContentsContract,
  filePathContract,
  questContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  isActiveWorkItemStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questHasValidStatusTransitionGuard } from '../../../guards/quest-has-valid-status-transition/quest-has-valid-status-transition-guard';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questPersistBroker } from '../persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;

export const questPauseBroker = async ({
  questId,
  processControls,
}: {
  questId: QuestId;
  guildId?: GuildId;
  // Accepted for API stability — the responder reads quest.status before racing anything and hands
  // it back here — but never read below: pausedAtStatus is stamped from the quest as loaded fresh
  // inside this broker's own lock turn, never from a caller's pre-lock snapshot, which is exactly
  // the staleness the "ghost running" fix below closes.
  previousStatus: QuestStatus;
  processControls: {
    findAllByQuestId: ({ questId }: { questId: QuestId }) => { processId: ProcessId }[];
    kill: ({ processId }: { processId: ProcessId }) => void;
  };
}): Promise<{ paused: boolean }> => {
  // EVERY registration for the quest, not the first one. Start Quest registers a quest-level
  // entry whose kill is a no-op, and it is registered before anything is spawned — so a lookup
  // that stops at the first match kills that no-op and leaves the real agent child running
  // against the worktree while the quest reads `paused`.
  for (const existingProcess of processControls.findAllByQuestId({ questId })) {
    processControls.kill({ processId: existingProcess.processId });
  }

  try {
    return await questWithModifyLockBroker({
      questId,
      run: async (): Promise<{ paused: boolean }> => {
        const { questPath } = await questFindQuestPathBroker({ questId });
        const questFilePath = filePathContract.parse(
          pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
        );
        const quest = await questLoadBroker({ questFilePath });

        // A second pause racing behind the first reaches this lock turn AFTER the first one's
        // write already landed `paused` — questStatusTransitionsStatics.paused deliberately
        // carries no paused -> paused self-loop (unlike in_progress / blocked / merging, which
        // each self-loop for exactly this reason), so the idempotent case is handled HERE, as a
        // clean no-op, rather than by widening that table.
        if (isUserPausedQuestStatusGuard({ status: quest.status })) {
          return { paused: true };
        }

        const isValidTransition = questHasValidStatusTransitionGuard({
          currentStatus: quest.status,
          nextStatus: 'paused',
        });
        if (!isValidTransition) {
          return { paused: false };
        }

        // Re-taken HERE, from the quest as loaded for THIS write, inside the same lock the write
        // goes through — never from a pre-lock snapshot. A snapshot taken before the lock can miss
        // an item spawn-batch-layer-broker re-stamps `in_progress` (fresh startedAt) between the
        // snapshot and the write, leaving a "ghost running" row a paused quest never caught.
        const nextWorkItems = quest.workItems.map((workItem) => {
          if (!isActiveWorkItemStatusGuard({ status: workItem.status })) {
            return workItem;
          }
          const reset: Record<PropertyKey, unknown> = { ...workItem, status: 'pending' };
          // The item is no longer running, so a stale start time from the run this pause just
          // caught has nothing left to measure an elapsed duration against.
          Reflect.deleteProperty(reset, 'startedAt');
          return workItemContract.parse(reset);
        });

        const mutated = questContract.parse({
          ...quest,
          workItems: nextWorkItems,
          status: 'paused',
          pausedAtStatus: quest.status,
          updatedAt: new Date().toISOString(),
        });

        const questJson = fileContentsContract.parse(
          JSON.stringify(mutated, null, JSON_INDENT_SPACES),
        );
        await questPersistBroker({ questFilePath, contents: questJson, questId });

        return { paused: true };
      },
    });
  } catch (error) {
    process.stderr.write(
      `[quest-pause] pause failed for quest ${questId}: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return { paused: false };
  }
};
