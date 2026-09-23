/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated. `complete` is
 * the sole signal kind, and a SESSION REPORTS, IT NEVER ROUTES: what the session did is already on
 * the record, written through `quest-work` — its marks on each assigned unit, and optionally an
 * outcome word, a request or an invalidation. This responder marks the WORK ITEM terminal.
 *
 * WHO MOVES THE SCOPE IS DECIDED BY `workItem.step`, and getting that wrong is invisible:
 *
 * - A work item carrying a STEP belongs to `questRouteScopeBroker`, which the dispatch scan calls on
 *   its next pass (`scan-once-layer-broker`) and which takes the step's own route — the next step's
 *   batch, the scope completing plus the next family's scopes minted, or a halt. So NOTHING on the
 *   ledger is touched here beyond the work item. Completing the linked operation item would end the
 *   whole scope on its FIRST signal: a codeweaver signalling at the end of `plan` would never reach
 *   `work`, `review`, `commit` or `ward`, and the next family would open behind it.
 * - A work item carrying NO step runs no step graph — a role no family carries (`spiritmender`, a
 *   chat role), or a ledger seeded before the graph. Nothing will ever route it, so its linked
 *   operation item completes here, in the same atomic persist, and `questAdvanceBroker` opens the
 *   next scope.
 *
 * Before any of that, `signalGateTransformer` checks this work item's `assignedUnitIds` against its
 * `observations[]`: any assigned unit carrying no observation refuses the call outright, naming every
 * unmarked unit in the thrown message, so the session marks it and signals again. The check runs once
 * idempotency has ruled out a redelivery and before anything is persisted, so a refusal leaves the
 * work item and its operation item exactly as they were.
 *
 * Agents have no failure signal for work they could have done — a unit a session could not settle is
 * marked `unmet` through `quest-work`, and the router mints a successor scoped to exactly those
 * units.
 *
 * `blockedReason`, when a session sends one, rides onto the terminal work item as `errorMessage` — a
 * diagnostic note, not a status: the item still completes.
 *
 * USAGE:
 * await QuestHandleSignalBackResponder({ questId, workItemId, signal: 'complete', operationItemId });
 */

import type {
  AdapterResult,
  BlockedReason,
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

import { questAdvanceBroker } from '../../../brokers/quest/advance/quest-advance-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questOperationsUpdateBroker } from '../../../brokers/quest/operations-update/quest-operations-update-broker';
import { signalGateTransformer } from '../../../transformers/signal-gate/signal-gate-transformer';

export const QuestHandleSignalBackResponder = async ({
  questId,
  workItemId,
  signal,
  operationItemId,
  blockedReason,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  signal: 'complete';
  operationItemId?: OperationItemId;
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

  // IDEMPOTENCY: a redelivered signal for an already-terminal work item is a no-op — the first
  // delivery already applied the outcome atomically.
  if (isTerminalWorkItemStatusGuard({ status: signaledItem.status })) {
    return adapterResultContract.parse({ success: true });
  }

  // UNMARKED-UNIT GATE — runs BEFORE any mutation, so a refusal leaves the work item and its
  // operation item exactly as they were and the session can mark and signal again. Denominator is
  // `workItem.assignedUnitIds`; story 14 owns the arithmetic and the refusal text, which rides
  // back to the agent verbatim.
  const gateResult = signalGateTransformer({ quest: result.quest, workItemId });
  if (!gateResult.ok) {
    throw new Error(gateResult.message);
  }

  // Read ONCE, off the same item the gate above graded, and spent in both places the scope could be
  // moved from — the persist below and the advance after it. A work item's `step` is written at mint
  // and never rewritten, so the pre-lock read and the callback's re-read cannot disagree about it.
  const runsStepGraph = signaledItem.step !== undefined;

  await questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      const workItem = quest.workItems.find((wi) => wi.id === workItemId);
      if (workItem === undefined || isTerminalWorkItemStatusGuard({ status: workItem.status })) {
        return null;
      }

      const completedAt = new Date().toISOString();
      const nextWorkItems = quest.workItems.map((wi) =>
        wi.id === workItemId
          ? workItemContract.parse({
              ...wi,
              status: 'complete',
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

      // The scope is the ROUTER's the moment this item runs a step graph, so the terminal work item
      // is the whole of this persist. `questRouteScopeBroker` picks the scope up on the dispatch
      // scan's next pass — it is the only thing that can read the step's route, and it needs the
      // scope still `in_progress` to find it at all.
      if (runsStepGraph || linkedOperation === undefined || linkedOperation.status === 'complete') {
        return { workItems: nextWorkItems };
      }

      // A step-less scope (no family carries this role, or a ledger seeded before the step graph)
      // completes its linked operation item here, in the same atomic persist.
      const completedOperations = quest.operations.map((operation) =>
        operation.id === linkedOperation.id
          ? operationItemContract.parse({ ...operation, status: 'complete' })
          : operation,
      );

      return { operations: completedOperations, workItems: nextWorkItems };
    },
  });

  // ENTERING the next scope belongs to whoever COMPLETED the last one. A stepped scope is still open
  // here, so advance would find the first `pending` operation item — the family's next cell — and
  // open it alongside a scope that has only finished one of its steps, running two scopes of one
  // family at once. The dispatch scan's own advance self-heal is what enters the next scope once the
  // router really has completed this one.
  if (!runsStepGraph) {
    await questAdvanceBroker({ questId });
  }

  return adapterResultContract.parse({ success: true });
};
