/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated. `complete` is
 * the sole signal kind (session-terminal marker); the operation OUTCOME rides on the call as
 * `operationStatus` and is applied here server-side (authoritative — an agent cannot forget to
 * patch the ledger, because agents never write the ledger at all):
 *
 * - `operationStatus: 'done'` (or absent) → the linked operation item is marked `complete`.
 * - `operationStatus: 'partial'` → the linked operation item is marked `complete` AND a
 *   "pt N: {text}" continuation item (same role, locked flag preserved) is appended immediately
 *   after it — duplicate-on-partial keeps the strict 1:1 operation-item↔work-item invariant and an
 *   immutable pt audit trail instead of reverting a shared item's status. For a locked (verify
 *   tail) role the pt chain is bounded by `slotManagerStatics.<role>.maxAttempts`; a spent chain
 *   blocks the quest via questBlockOnFailureBroker instead of appending.
 * - `operationStatus: 'blocked'` → an environment wall (a denied command, a missing credential, an
 *   unreachable service) that no fresh session of the same role could pass. The item is marked
 *   `complete` and a continuation is appended exactly as for `partial`, so a resume re-dispatches
 *   this same scope — but the work item is marked `failed` carrying `blockedReason` as its
 *   `errorMessage`, and the quest blocks IMMEDIATELY. The pt budget does NOT gate this append: the
 *   block is itself the bound, and skipping the append would silently drop the operation on resume.
 *   Spending the budget on sessions that provably cannot succeed is exactly what this outcome
 *   exists to prevent.
 *
 * Work-item-terminal + operation-complete + the optional pt N land in ONE persist
 * (questOperationsUpdateBroker), so a crash is all-or-nothing; afterwards questAdvanceBroker
 * creates the next work item. Agents have no failure signal for work they could have done — they
 * fix their own problems and move forward; the only other failure concept is a ward exit-code red,
 * handled in quest-run-ward-broker.
 *
 * USAGE:
 * await QuestHandleSignalBackResponder({ questId, workItemId, signal: 'complete', operationItemId, operationStatus: 'done' });
 */

import type {
  AdapterResult,
  BlockedReason,
  OperationItem,
  OperationItemId,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  errorMessageContract,
  getQuestInputContract,
  operationItemContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { isBlightwardenMinionRoleGuard } from '../../../guards/is-blightwarden-minion-role/is-blightwarden-minion-role-guard';
import { questAdvanceBroker } from '../../../brokers/quest/advance/quest-advance-broker';
import { questBlockOnFailureBroker } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questOperationsUpdateBroker } from '../../../brokers/quest/operations-update/quest-operations-update-broker';
import { operationPtChainTransformer } from '../../../transformers/operation-pt-chain/operation-pt-chain-transformer';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

export const QuestHandleSignalBackResponder = async ({
  questId,
  workItemId,
  signal,
  operationItemId,
  operationStatus,
  blockedReason,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  signal: 'complete';
  operationItemId?: OperationItemId;
  operationStatus?: 'done' | 'partial' | 'blocked';
  blockedReason?: BlockedReason;
}): Promise<AdapterResult> => {
  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });
  if (!result.success || !result.quest) {
    // The quest exists but could not be read/parsed (corrupt quest.json, transient I/O).
    // Returning success here silently DROPS the agent's signal: the work item never transitions
    // and the dispatch loop goes idle while every surface reports green. Throw so the failure
    // rides the awaited signal-back path back to the MCP tool and the agent — visible and
    // retryable — instead of vanishing.
    throw new Error(
      `signal-back could not load quest ${questId} to apply '${signal}' to work item ${workItemId}: ${result.error ?? 'unknown error'}`,
    );
  }

  const signaledItem = result.quest.workItems.find((wi) => wi.id === workItemId);
  if (!signaledItem) {
    // Quest loaded, but this id is not on it at all. That is NOT a redelivery — a redelivery finds
    // its item and lands in the already-terminal branch below. Nothing legitimate produces an id
    // that was never on the quest, so this is a wrong, stale or fabricated one. Reporting success
    // for it is worse than useless: the agent ends its turn believing it signalled while its REAL
    // work item sits at `in_progress` until orphan recovery spends a reset on it, and the agent has
    // no way to tell the difference. Throw for exactly the reason the unreadable-quest branch above
    // throws — the failure must ride back up the awaited signal-back path to the caller.
    throw new Error(
      `signal-back: work item ${workItemId} is not on quest ${questId} — nothing was applied`,
    );
  }

  // IDEMPOTENCY: a redelivered signal for an already-terminal work item must not mint a second
  // pt N continuation + work item. The first delivery already applied the outcome atomically.
  if (isTerminalWorkItemStatusGuard({ status: signaledItem.status })) {
    return adapterResultContract.parse({ success: true });
  }

  // Object holder (not a bare `let`): the flag is assigned inside the update callback, which
  // TypeScript's flow analysis cannot see — a bare boolean would read as always-false.
  const blockedOnSpentPtChain = { value: false };
  const isEnvironmentWall = operationStatus === 'blocked';

  await questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      const workItem = quest.workItems.find((wi) => wi.id === workItemId);
      if (workItem === undefined || isTerminalWorkItemStatusGuard({ status: workItem.status })) {
        return null;
      }

      const completedAt = new Date().toISOString();
      // An environment wall is a `failed` work item carrying the reason, so the execution row
      // renders WHY the quest halted. Every other outcome is a `complete` session.
      const nextWorkItems = quest.workItems.map((wi) =>
        wi.id === workItemId
          ? workItemContract.parse({
              ...wi,
              status: isEnvironmentWall ? 'failed' : 'complete',
              completedAt,
              actualSignal: 'complete',
              ...(blockedReason === undefined
                ? {}
                : { errorMessage: errorMessageContract.parse(String(blockedReason)) }),
            })
          : wi,
      );

      // Resolve the linked operation item: the signal's explicit operationItemId wins, else the
      // work item's own operations/<id> ref. A work item with no link (legacy/chat) just
      // terminates.
      const linkedRef = workItem.relatedDataItems
        .map((ref) => String(ref))
        .find((ref) => ref.startsWith('operations/'));
      const linkedId = operationItemId === undefined ? linkedRef?.split('/')[1] : operationItemId;
      const linkedOperation = quest.operations.find((operation) => operation.id === linkedId);

      if (linkedOperation === undefined || linkedOperation.status === 'complete') {
        return { workItems: nextWorkItems };
      }

      const completedOperations = quest.operations.map((operation) =>
        operation.id === linkedOperation.id
          ? operationItemContract.parse({ ...operation, status: 'complete' })
          : operation,
      );

      if (operationStatus !== 'partial' && !isEnvironmentWall) {
        return { operations: completedOperations, workItems: nextWorkItems };
      }

      // Duplicate-on-partial: append "pt N: {text}" right after the completed item. Locked
      // (verify tail) roles are bounded — a spent pt chain blocks instead of looping forever.
      const { base, chainLength } = operationPtChainTransformer({
        operations: quest.operations,
        item: linkedOperation,
      });
      const maxAttempts = ((): typeof slotManagerStatics.codeweaver.maxAttempts | undefined => {
        const role: OperationItem['role'] = linkedOperation.role;
        if (role === 'chaoswhisperer' || role === 'glyphsmith' || role === 'ward') {
          return undefined;
        }
        if (isBlightwardenMinionRoleGuard({ role })) {
          return undefined;
        }
        const budgets = slotManagerStatics;
        return role === 'codeweaver'
          ? budgets.codeweaver.maxAttempts
          : role === 'flowrider'
            ? budgets.flowrider.maxAttempts
            : role === 'siegemaster'
              ? budgets.siegemaster.maxAttempts
              : role === 'lawbringer'
                ? budgets.lawbringer.maxAttempts
                : role === 'blightwarden'
                  ? budgets.blightwarden.maxAttempts
                  : role === 'pesteater'
                    ? budgets.pesteater.maxAttempts
                    : budgets.spiritmender.maxAttempts;
      })();
      // The pt budget gates `partial` only. An environment wall always appends its continuation:
      // the quest blocks either way, and withholding the append would leave the operation with no
      // pending item, so a resume would silently skip this scope entirely.
      if (
        !isEnvironmentWall &&
        linkedOperation.locked &&
        maxAttempts !== undefined &&
        chainLength >= maxAttempts
      ) {
        blockedOnSpentPtChain.value = true;
        return { operations: completedOperations, workItems: nextWorkItems };
      }

      // `flowIds` rides along with the role and lock: a flow-scoped item (flowrider/siegemaster)
      // whose continuation lost its flows would hand the fresh session no scope at all.
      const continuation = operationItemContract.parse({
        id: crypto.randomUUID(),
        role: linkedOperation.role,
        text: `pt ${String(chainLength + 1)}: ${base}`,
        status: 'pending',
        locked: linkedOperation.locked,
        flowIds: linkedOperation.flowIds,
        ...(linkedOperation.wardMode === undefined ? {} : { wardMode: linkedOperation.wardMode }),
      });

      const insertIndex =
        completedOperations.findIndex((operation) => operation.id === linkedOperation.id) + 1;
      const withContinuation = [
        ...completedOperations.slice(0, insertIndex),
        continuation,
        ...completedOperations.slice(insertIndex),
      ];

      return { operations: withContinuation, workItems: nextWorkItems };
    },
  });

  // Both halt routes drain pending work items and flip the quest to `blocked`; neither advances,
  // because the next session would hit the very wall (or spent budget) that stopped this one.
  if (blockedOnSpentPtChain.value || isEnvironmentWall) {
    await questBlockOnFailureBroker({ questId, failedWorkItemId: workItemId });
    return adapterResultContract.parse({ success: true });
  }

  await questAdvanceBroker({ questId });

  return adapterResultContract.parse({ success: true });
};
