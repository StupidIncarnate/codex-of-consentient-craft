/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated. Transitions the
 * named work item to its terminal status and stamps `completedAt`, then routes by signal + role.
 *
 * The orchestrator is RECOVERY-FIRST: NO role blocks the quest on a failure. Every failure routes to a
 * fixer, and the SOLE block path is the PathSeeker replan loop being exhausted (or PathSeeker itself
 * exhausting its retries). Routing:
 *
 * - `complete` + `pathseeker` → fires `questPostWalkHookBroker` to generate the downstream chain (a
 *   thrown hook means the plan is unusable → BLOCK, the one PathSeeker-owned block).
 * - `complete` (any other role) → mark the item `complete`.
 * - `failed` / `failed-replan` from a blightwarden MINION → NON-BLOCKING: the item terminates
 *   `complete` (`actualSignal` records the real signal); the finding lives in the minion's report.
 * - `failed` / `failed-replan` from `spiritmender` (the fixer itself) → SOFT-FAIL: mark the item
 *   `failed` and do nothing else. The retry the recovery already spliced after it (a ward re-verify or
 *   a fresh role run) carries the work forward; spawning another fixer would recurse.
 * - `failed` / `failed-replan` from `pathseeker` (the planner + sole block owner) → RETRY within its
 *   loop (reset to `pending`, `attempt + 1`, re-dispatched); when its budget is spent → BLOCK. This is
 *   the only role that can drive the quest to `blocked`.
 * - `failed-replan` from a code-recovery role (a plan hole it cannot reconcile) → PathSeeker replan
 *   (`questSplicePathseekerReplanBroker`): splice a `pathseeker` replan fed the brief, drain pending to
 *   `skipped`. On the replan's completion the post-walk hook regenerates the chain. Blocks only when
 *   the replan loop is exhausted.
 * - `failed` from a code-recovery role (code it could not build/verify) → mark the item `failed`
 *   (persisting the finding), then `questRecoverRoleBroker`: splice a spiritmender fix + a ward gate +
 *   a fresh re-run of the same role. When the role's retry budget is spent the code failure is
 *   re-interpreted as a plan hole and escalates to a PathSeeker replan. Never an immediate block.
 *
 * USAGE:
 * await QuestHandleSignalBackResponder({ questId, workItemId, signal: 'complete' });
 */

import type {
  AdapterResult,
  ModifyQuestInput,
  QuestId,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  errorMessageContract,
  getQuestInputContract,
} from '@dungeonmaster/shared/contracts';

import { isBlightwardenMinionRoleGuard } from '../../../guards/is-blightwarden-minion-role/is-blightwarden-minion-role-guard';
import { questBlockOnFailureBroker } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyOrThrowBroker } from '../../../brokers/quest/modify-or-throw/quest-modify-or-throw-broker';
import { questPostWalkHookBroker } from '../../../brokers/quest/post-walk-hook/quest-post-walk-hook-broker';
import { questRecoverRoleBroker } from '../../../brokers/quest/recover-role/quest-recover-role-broker';
import { questSplicePathseekerReplanBroker } from '../../../brokers/quest/splice-pathseeker-replan/quest-splice-pathseeker-replan-broker';

export const QuestHandleSignalBackResponder = async ({
  questId,
  workItemId,
  signal,
  summary,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  signal: 'complete' | 'failed' | 'failed-replan';
  summary?: WorkItem['summary'];
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
      // The post-walk hook runs the completeness scope and generates the downstream chain. If it
      // throws (the authored plan failed completeness — e.g. a step references a contract absent from
      // quest.contracts[]), the walk item is already `complete`, so the quest would derive `complete`
      // (terminal, never re-scanned) with no implementation chain. A failed hook means the plan is
      // unusable, so route it to BLOCK — the one PathSeeker-owned block. This keeps the invariant that
      // a quest never reads `complete` without its implementation work having been generated.
      try {
        await questPostWalkHookBroker({ questId, walkWorkItemId: workItemId });
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

  // ---- signal is `failed` or `failed-replan` ----

  // Blightwarden minions never block: the failure is captured in the minion's blight report, so the
  // work item terminates `complete` (satisfies the synthesizer's dependsOn) and the quest can still
  // complete. `actualSignal` preserves the real signal for audit.
  if (isBlightwardenMinionRoleGuard({ role: workItem.role })) {
    await questModifyOrThrowBroker({
      input: {
        questId,
        workItems: [{ id: workItemId, status: 'complete', completedAt, actualSignal: signal }],
      } as ModifyQuestInput,
    });
    return adapterResultContract.parse({ success: true });
  }

  // Spiritmender is the fixer itself. Its own `failed` is SOFT: mark it terminal and stop. The retry
  // the recovery already spliced after it (a ward re-verify or a fresh role run) depends on it and
  // carries the work forward — spawning another spiritmender would recurse. `failed` satisfies a
  // dependsOn, so the downstream retry still dispatches.
  if (workItem.role === 'spiritmender') {
    await questModifyOrThrowBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItemId,
            status: 'failed',
            completedAt,
            actualSignal: signal,
            ...(summary === undefined ? {} : { summary }),
          },
        ],
      } as ModifyQuestInput,
    });
    return adapterResultContract.parse({ success: true });
  }

  // PathSeeker is the planner AND the sole block owner. A `failed` (it could not produce a workable
  // plan; `failed-replan` from the planner is treated the same) RETRIES within its loop — reset to
  // `pending`, `attempt + 1`, per-run identity cleared so the next dispatch re-runs it — and only
  // BLOCKs once its retry budget is spent. No other role reaches a block here.
  if (workItem.role === 'pathseeker') {
    if (workItem.attempt < workItem.maxAttempts - 1) {
      await questModifyOrThrowBroker({
        input: {
          questId,
          workItems: [
            {
              id: workItemId,
              status: 'pending',
              attempt: workItem.attempt + 1,
              sessionId: null,
              agentId: null,
              startedAt: null,
              ...(summary === undefined ? {} : { summary }),
            },
          ],
        } as ModifyQuestInput,
      });
      return adapterResultContract.parse({ success: true });
    }
    await questModifyOrThrowBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItemId,
            status: 'failed',
            completedAt,
            ...(summary === undefined ? {} : { summary }),
          },
        ],
      } as ModifyQuestInput,
    });
    await questBlockOnFailureBroker({ questId, failedWorkItemId: workItemId });
    return adapterResultContract.parse({ success: true });
  }

  // `failed-replan` from a code-recovery role: a plan hole it cannot reconcile. Route straight to a
  // PathSeeker replan (which marks the item failed + superseded, drains pending, and regenerates the
  // chain on completion). Blocks only when the replan loop is exhausted.
  if (signal === 'failed-replan') {
    await questSplicePathseekerReplanBroker({
      questId,
      failedWorkItemId: workItemId,
      brief: summary,
      actualSignal: 'failed-replan',
    });
    return adapterResultContract.parse({ success: true });
  }

  // `failed` (code) from a code-recovery role: mark the item `failed` (persisting the finding so it is
  // durable + readable), then splice a spiritmender fix + ward gate + a fresh re-run of the role via
  // questRecoverRoleBroker. When the role's retry budget is spent the code failure escalates to a
  // PathSeeker replan — never an immediate block.
  await questModifyOrThrowBroker({
    input: {
      questId,
      workItems: [
        {
          id: workItemId,
          status: 'failed',
          completedAt,
          ...(summary === undefined ? {} : { summary }),
        },
      ],
    } as ModifyQuestInput,
  });

  await questRecoverRoleBroker({ questId, failedWorkItemId: workItemId, finding: summary });

  return adapterResultContract.parse({ success: true });
};
