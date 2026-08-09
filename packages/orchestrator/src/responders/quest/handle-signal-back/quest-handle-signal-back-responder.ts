/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated. `complete` is
 * the sole signal kind (session-terminal marker); the operation OUTCOME rides on the call as
 * `operationStatus` and is applied here server-side (authoritative — an agent cannot forget to
 * patch the ledger, because agents never write the ledger at all):
 *
 * - `operationStatus: 'done'` (or absent) → the linked operation item is marked `complete`. For a
 *   `flowrider` or `siegemaster` item, or a `blightwarden` item, this is GATED: the responder
 *   recomputes the signalling role's own scope — the flow graph's verification units measured
 *   against THAT role's sign-off track (`flowriderSignoff` / `siegemasterSignoff`), or the quest
 *   diff's blight checklist (blightwarden, via questGetBlightChecklistBroker) — and refuses `done`
 *   (by throwing, so the agent sees why) while any unit carries no sign-off on that track / no
 *   entry in `quest.planningNotes.blightLedger` respectively. Completion is a computed fact rather
 *   than the agent's recollection of its own pass. The two sign-off tracks are INDEPENDENT: neither
 *   reads the other's field, so one unit can be outstanding for one track and settled for the
 *   other. Both verdicts clear a unit — `confirmed` and `unconfirmable` alike — as does every
 *   blight disposition, so the gate is always satisfiable honestly; it refuses absence, not
 *   honesty.
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
import {
  isChatWorkItemRoleGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import { isBlightwardenMinionRoleGuard } from '../../../guards/is-blightwarden-minion-role/is-blightwarden-minion-role-guard';
import { questAdvanceBroker } from '../../../brokers/quest/advance/quest-advance-broker';
import { questBlockOnFailureBroker } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questGetBlightChecklistBroker } from '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker';
import { questOperationsUpdateBroker } from '../../../brokers/quest/operations-update/quest-operations-update-broker';
import { blightCoverageOutstandingTransformer } from '../../../transformers/blight-coverage-outstanding/blight-coverage-outstanding-transformer';
import { operationPtChainTransformer } from '../../../transformers/operation-pt-chain/operation-pt-chain-transformer';
import { signoffOutstandingTransformer } from '../../../transformers/signoff-outstanding/signoff-outstanding-transformer';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

// How many outstanding unit ids to name inline before deferring to get-qa-checklist / the blight
// equivalent. Enough to act on directly for a nearly-finished flow or diff, short of dumping 144
// ids into a tool error.
const OUTSTANDING_PREVIEW_LIMIT = 15;

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

  // COMPLETION GATE — runs BEFORE any mutation, so a refused `done` leaves the work item and its
  // operation item exactly as they were and the session can carry on and signal again.
  //
  // `done` from a flowrider or siegemaster item means "every verification unit in my scope carries
  // MY track's sign-off"; `done` from a blightwarden item means "every changed-file/concern unit on
  // this quest diff has been dealt with". A session's memory of its own coverage is precisely what
  // fails: a pass walks part of its scope across a long serial run and reports done. Both claims are
  // therefore recomputed here — the flow graph read against the signalling role's own sign-off field
  // for the two verification tracks, the git diff (via questGetBlightChecklistBroker) + blightLedger
  // for blightwarden.
  //
  // ONE call covers BOTH verification tracks. `signoffOutstandingTransformer` keys on the linked
  // item's role internally (flowrider → `flowriderSignoff`, siegemaster → `siegemasterSignoff`,
  // every other role → nothing outstanding), so a second per-track branch here would only restate
  // what it already decides — and the two tracks are independent, so the same unit can be
  // outstanding for one and settled for the other.
  //
  // Both sign-off verdicts clear a unit — `confirmed` and `unconfirmable` alike — as does every
  // blight disposition, `gap` and `recorded` included, so the gate is always satisfiable honestly;
  // what it refuses is scope with no sign-off at all. An operation item is never both a verification
  // track and blightwarden, so at most one of the two transformers below ever contributes.
  //
  // The blight branch is gated on the linked operation's role so a git diff does not run on every
  // signal-back from every role — only a blightwarden item ever calls questGetBlightChecklistBroker.
  //
  // Throwing (rather than returning) is deliberate and matches the unloadable-quest case above: the
  // error rides the awaited signal-back path back through the MCP tool to the agent, where it is
  // visible and actionable, instead of being silently swallowed as a success.
  if (operationStatus === undefined || operationStatus === 'done') {
    const linkedRef = signaledItem.relatedDataItems
      .map((ref) => String(ref))
      .find((ref) => ref.startsWith('operations/'));
    const linkedId = operationItemId === undefined ? linkedRef?.split('/')[1] : operationItemId;
    const linkedOperation = result.quest.operations.find((operation) => operation.id === linkedId);

    if (linkedOperation !== undefined) {
      const signoffOutstanding = signoffOutstandingTransformer({
        quest: result.quest,
        operationItem: linkedOperation,
      });
      const isBlightwarden = linkedOperation.role === 'blightwarden';
      const blightChecklist = isBlightwarden
        ? await questGetBlightChecklistBroker({ questId })
        : null;
      const blightOutstanding = blightCoverageOutstandingTransformer({
        operationItem: linkedOperation,
        checklist: blightChecklist,
      });
      const outstanding = [...signoffOutstanding, ...blightOutstanding];

      if (outstanding.length > 0) {
        // The signalling role IS the track: the list above was measured against that role's own
        // sign-off field and nothing else, so the remedy can name the exact field to write.
        const track = linkedOperation.role === 'flowrider' ? 'flowrider' : 'siegemaster';
        const checklistTool = isBlightwarden
          ? 'get-blight-checklist'
          : `get-qa-checklist({ track: '${track}' })`;

        const headline = isBlightwarden
          ? `signal-back refused: operationStatus 'done' means every review unit on this quest diff carries a disposition, and ${String(outstanding.length)} still carry none.`
          : `signal-back refused: operationStatus 'done' means every verification unit in your scope carries YOUR OWN track's sign-off (\`${track}Signoff\`), and ${String(outstanding.length)} still carry none. The other track is measured separately and is never read here, so its sign-offs cannot settle yours.`;

        const remedy = isBlightwarden
          ? [
              '  1. Deal with each remaining unit and record it in quest.planningNotes.blightLedger (a `gap` or `recorded` entry with a real reason counts — this gate refuses absence, not honesty).',
              "  2. Signal operationStatus: 'partial' instead, which hands the named remainder to a fresh session of your role.",
            ]
          : [
              `  1. Write a \`${track}Signoff\` on each remaining unit via modify-quest — \`confirmed\` with \`evidence\` (a test file:line plus what makes that test fail, or the value you measured off the running system), or \`unconfirmable\` with \`evidence\` of what you tried and why it was out of reach plus a \`question\` someone else can pick up. BOTH verdicts clear this gate; what it refuses is the ABSENCE of a sign-off, never an honest one.`,
              '     BATCH the writes: ONE modify-quest call carrying many sign-offs, never one call per unit.',
              "  2. Signal operationStatus: 'partial' instead, which hands the named remainder to a fresh session of your role.",
              '     A unit you genuinely cannot close is `unconfirmable`, not pt work — pt-chaining a permanently unprovable unit only burns the chain to its maxAttempts and blocks the quest.',
            ];

        throw new Error(
          [
            headline,
            '',
            'Outstanding units:',
            ...outstanding.slice(0, OUTSTANDING_PREVIEW_LIMIT).map((id) => `  - ${String(id)}`),
            ...(outstanding.length > OUTSTANDING_PREVIEW_LIMIT
              ? [
                  `  … and ${String(outstanding.length - OUTSTANDING_PREVIEW_LIMIT)} more — call ${checklistTool} for the full list.`,
                ]
              : []),
            '',
            'Do ONE of these, then signal again:',
            ...remedy,
          ].join('\n'),
        );
      }
    }
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
        if (isChatWorkItemRoleGuard({ role }) || role === 'ward') {
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
              : role === 'blightwarden'
                ? budgets.blightwarden.maxAttempts
                : role === 'pesteater'
                  ? budgets.pesteater.maxAttempts
                  : role === 'warpgate'
                    ? budgets.warpgate.maxAttempts
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
