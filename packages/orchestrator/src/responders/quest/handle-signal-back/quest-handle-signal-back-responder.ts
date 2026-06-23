/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated.
 * Transitions the named work item to its terminal status and stamps `completedAt`, then routes
 * by signal + role:
 *
 * - `complete` + `pathseeker` → fires `questPostWalkHookBroker` to generate the downstream
 *   codeweaver/ward/siegemaster/lawbringer/minions/synthesizer chain.
 * - `failed` / `failed-replan` from a blightwarden MINION → NON-BLOCKING. The minion's work item
 *   terminates `complete` (with `actualSignal` recording the real signal) so the synthesizer's
 *   `dependsOn` is satisfied and the quest is not blocked. The failure detail lives in the minion's
 *   `PlanningBlightReport`, which the synthesizer reads and handles.
 * - `failed-replan` from the blightwarden synthesizer → REPLAN. Marks the synthesizer `failed`
 *   (superseded by the replan it inserts), drains pending items to `skipped`, and splices a
 *   `pathseeker` replan (`dependsOn: []`, `insertedBy: <synth id>`). The respawned PathSeeker
 *   resumes off `planningNotes` (steps already present → re-walks), and on `complete` re-fires the
 *   post-walk hook, regenerating the whole downstream chain. The quest stays `in_progress` (a bare
 *   workItems write never derives `blocked`).
 * - `failed` from any other agent role → BLOCK via `questBlockOnFailureBroker` (drains pending
 *   items to `skipped`, sets status `blocked`). Lawbringer/siegemaster/blightwarden fix what they
 *   find inline, so a `failed` signal means a genuinely unfixable issue.
 *
 * USAGE:
 * await QuestHandleSignalBackResponder({ questId, workItemId, signal: 'complete' });
 * // Persists workItems: [{ id: workItemId, status: 'complete', completedAt }] and (for
 * // pathseeker-walk + complete) generates the downstream work-item chain.
 */

import type {
  AdapterResult,
  ModifyQuestInput,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  errorMessageContract,
  getQuestInputContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import { isPendingWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { isBlightwardenMinionRoleGuard } from '../../../guards/is-blightwarden-minion-role/is-blightwarden-minion-role-guard';
import { questBlockOnFailureBroker } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyOrThrowBroker } from '../../../brokers/quest/modify-or-throw/quest-modify-or-throw-broker';
import { questPostWalkHookBroker } from '../../../brokers/quest/post-walk-hook/quest-post-walk-hook-broker';

const PATHSEEKER_REPLAN_MAX_ATTEMPTS = 3;

export const QuestHandleSignalBackResponder = async ({
  questId,
  workItemId,
  signal,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  signal: 'complete' | 'failed' | 'failed-replan';
}): Promise<AdapterResult> => {
  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });
  if (!result.success || !result.quest) {
    // The quest exists but could not be read/parsed (corrupt quest.json, transient I/O) — a
    // `success: true` result always carries a quest, so a missing one is the same malformed-load
    // case. Returning success here silently DROPS the agent's signal: the work item never
    // transitions and the dispatch loop goes idle while every surface reports green. Throw so the
    // failure rides the awaited signal-back path back to the MCP tool and the agent — visible and
    // retryable — instead of vanishing.
    throw new Error(
      `signal-back could not load quest ${questId} to apply '${signal}' to work item ${workItemId}: ${result.error ?? 'unknown error'}`,
    );
  }

  const workItem = result.quest.workItems.find((wi) => wi.id === workItemId);
  if (!workItem) {
    // Quest loaded, but the work item genuinely isn't on it (double signal-back / unknown id).
    // Nothing to transition — an idempotent no-op, safe to report success.
    return adapterResultContract.parse({ success: true });
  }

  const completedAt = new Date().toISOString();

  if (signal === 'complete') {
    await questModifyOrThrowBroker({
      input: {
        questId,
        workItems: [{ id: workItemId, status: 'complete', completedAt }],
      } as ModifyQuestInput,
    });

    if (workItem.role === 'pathseeker') {
      // The post-walk hook runs the completeness scope and generates the downstream
      // codeweaver/ward/lawbringer/blightwarden chain. If it throws (the authored plan failed
      // completeness — e.g. a step references a contract absent from quest.contracts[]), the walk
      // item is already marked `complete` above, so the quest derives `complete` (every work item
      // terminal) — a terminal status `loadActiveQuestsLayerBroker` never re-scans, stranding the
      // quest with no implementation chain. A failed hook means the plan is unusable, so route it
      // to BLOCK: flip the walk item to `failed` and drain pending items, the same containment as
      // any other unfixable agent failure. This keeps the invariant that a quest never reads
      // `complete` without its implementation work having been generated.
      try {
        await questPostWalkHookBroker({
          questId,
          walkWorkItemId: workItemId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorMessage = errorMessageContract.parse(
          message.length > 0 ? message : 'post_walk_hook_failed',
        );
        await questModifyOrThrowBroker({
          input: {
            questId,
            workItems: [{ id: workItemId, status: 'failed', completedAt, errorMessage }],
          } as ModifyQuestInput,
        });
        await questBlockOnFailureBroker({ questId, failedWorkItemId: workItemId });
      }
    }
    return adapterResultContract.parse({ success: true });
  }

  // Minion failures never block: the failure is captured in the minion's blight report, so the
  // work item terminates `complete` (satisfies the synthesizer's dependsOn) and the quest can
  // still complete. `actualSignal` preserves the real signal for audit.
  if (isBlightwardenMinionRoleGuard({ role: workItem.role })) {
    await questModifyOrThrowBroker({
      input: {
        questId,
        workItems: [{ id: workItemId, status: 'complete', completedAt, actualSignal: signal }],
      } as ModifyQuestInput,
    });
    return adapterResultContract.parse({ success: true });
  }

  // Synthesizer escalation: replan instead of block. Mark the synthesizer `failed` (superseded by
  // the replan, so it is not an unresolved failure), drain pending items to `skipped`, and splice a
  // `pathseeker-walk` replan that re-fires the post-walk hook on completion. The replan depends on
  // nothing so it is immediately dispatchable and not dead-ended on the failed item.
  if (signal === 'failed-replan') {
    const summary = workItem.summary === undefined ? undefined : String(workItem.summary);
    const errorMessage =
      summary !== undefined && summary.length > 0
        ? errorMessageContract.parse(summary)
        : errorMessageContract.parse('blightwarden_replan_requested');

    const pendingSkips = result.quest.workItems
      .filter((wi) => isPendingWorkItemStatusGuard({ status: wi.status }) && wi.id !== workItemId)
      .map((wi) => ({ id: wi.id, status: 'skipped' as const, completedAt }));

    const replanItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'pathseeker',
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: [],
      maxAttempts: PATHSEEKER_REPLAN_MAX_ATTEMPTS,
      createdAt: completedAt,
      insertedBy: workItemId,
    });

    await questModifyOrThrowBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItemId,
            status: 'failed',
            completedAt,
            errorMessage,
            actualSignal: 'failed-replan',
          },
          ...pendingSkips,
          replanItem,
        ],
      } as ModifyQuestInput,
    });
    return adapterResultContract.parse({ success: true });
  }

  // signal === 'failed' from any non-minion agent role → BLOCK.
  await questModifyOrThrowBroker({
    input: {
      questId,
      workItems: [{ id: workItemId, status: 'failed', completedAt }],
    } as ModifyQuestInput,
  });
  await questBlockOnFailureBroker({ questId, failedWorkItemId: workItemId });

  return adapterResultContract.parse({ success: true });
};
