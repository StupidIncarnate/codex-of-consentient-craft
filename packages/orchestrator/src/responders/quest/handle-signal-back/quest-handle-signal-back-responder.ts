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
 * On EVERY outcome — `done`, `partial` and `blocked` alike — a role that changes code is refused
 * while the quest's own worktree still carries uncommitted changes, tracked or untracked. A
 * `blocked` quest hands its work forward through git exactly as a finished one does, so the
 * outcome that halts is the one that most needs the work durable first.
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
  ErrorMessage,
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
  isCommandWorkItemRoleGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import { gitWorkingTreeFilesBroker } from '../../../brokers/git/working-tree-files/git-working-tree-files-broker';
import { questAdvanceBroker } from '../../../brokers/quest/advance/quest-advance-broker';
import { questBlockOnFailureBroker } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker';
import { questCwdResolveBroker } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questOperationsUpdateBroker } from '../../../brokers/quest/operations-update/quest-operations-update-broker';
import { operationPtChainTransformer } from '../../../transformers/operation-pt-chain/operation-pt-chain-transformer';
import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

// How many outstanding unit ids (or dirty paths) to name inline before deferring to the tool that
// lists the rest. Enough to act on directly for a nearly-finished flow or diff, short of dumping
// 144 ids into a tool error.
const OUTSTANDING_PREVIEW_LIMIT = 15;

// The five roles that run a planner/worker/reviewer round over an operation item. Read from
// `agentPromptClassificationStatics` rather than listed here, so a role added to it joins
// CODE_CHANGING_ROLES below automatically — the same reason `isChatWorkItemRoleGuard` reads
// `workItemRoleStatics.chat` instead of growing an `||` chain.
const OPERATOR_ROLES = agentPromptClassificationStatics.operatorRoleNames;

// Every role whose session ends by CHANGING CODE, and therefore owes a commit before it signals.
// The five operator roles plus the two bespoke-prompt workers that also write code and commit.
// Both COMMAND roles (`workItemRoleStatics.command` — `ward`, `riftcarver`) are absent because they
// are terminal by exit code and never reach signal-back at all; every chat role is absent because a
// conversation produces a spec, not a commit.
const CODE_CHANGING_ROLES: ReadonlySet<OperationItem['role']> = new Set([
  ...OPERATOR_ROLES,
  'spiritmender',
  'warpgate',
]);

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

  // The linked operation item, resolved ONCE ahead of every pre-mutation gate below: the signal's
  // explicit operationItemId wins, else the work item's own `operations/<id>` ref. A work item with
  // no link (legacy/chat) is gated by nothing and simply terminates.
  const preGateRef = signaledItem.relatedDataItems
    .map((ref) => String(ref))
    .find((ref) => ref.startsWith('operations/'));
  const preGateId = operationItemId === undefined ? preGateRef?.split('/')[1] : operationItemId;
  const gatedOperation = result.quest.operations.find((operation) => operation.id === preGateId);

  // COMMIT-BEFORE-SIGNAL GATE — runs BEFORE any mutation, so a refusal leaves the work item and its
  // operation item exactly as they were and the session can commit and signal again.
  //
  // This is a GATE rather than a line in the operating rules because the post-mortem measured what
  // a prose instruction is worth here: §4.3 has a session dying ONE gate short of its commit while
  // holding a fully verified, twice-green artifact. The re-carve destroyed it — 101 minutes of
  // wall-clock for 11 minutes of work, with no trace in quest.json that any of it ever happened.
  // A computed consequence bolted to the exact parameter holds; the same sentence in a prompt does
  // not.
  //
  // It applies on `done`, `partial` AND `blocked` alike: a blocked quest hands its work forward
  // through git exactly as a finished one does, so the outcome that halts is the one that most
  // needs the work durable first.
  //
  // The measurement is `gitWorkingTreeFilesBroker`, which unions `git diff HEAD --name-only` with
  // `git ls-files --others --exclude-standard` — a bare diff reports TRACKED paths only, so the
  // net-new files a worker just wrote (the ones most likely to carry the defect) would be invisible
  // to it and a dirty tree would read as clean.
  //
  // The question is "is the tree clean", never "did you make a commit": `git commit --allow-empty`
  // satisfies it, so a round that legitimately changed nothing still signals. And a quest with no
  // worktree of its own — a hydrated quest, or one seeded before worktrees — SKIPS the check
  // rather than failing it: that is a real state, not a violation.
  //
  // `undefined` means the signalling role owes no git measurement at all — a chat role or a
  // COMMAND role never resolves a cwd and therefore never pays this gate's git cost.
  const resolution =
    gatedOperation !== undefined && CODE_CHANGING_ROLES.has(gatedOperation.role)
      ? await questCwdResolveBroker({ questId })
      : undefined;

  if (resolution?.kind === 'worktree') {
    const dirtyPaths = await gitWorkingTreeFilesBroker({ cwd: resolution.cwd });

    if (dirtyPaths.length > 0) {
      throw new Error(
        [
          `signal-back refused: the quest worktree still carries ${String(dirtyPaths.length)} uncommitted change(s), so the work this signal reports is not in history yet and the next session inherits a dirty tree it did not write.`,
          '',
          'Uncommitted paths:',
          ...dirtyPaths.slice(0, OUTSTANDING_PREVIEW_LIMIT).map((path) => `  - ${String(path)}`),
          ...(dirtyPaths.length > OUTSTANDING_PREVIEW_LIMIT
            ? [
                `  … and ${String(dirtyPaths.length - OUTSTANDING_PREVIEW_LIMIT)} more — run \`git status\` in the worktree for the full list.`,
              ]
            : []),
          '',
          'Do ONE of these, then signal again:',
          '  1. Commit this round in the quest worktree. This gate asks whether the TREE IS CLEAN, never whether you made a commit — `git commit --allow-empty` satisfies it, so a round that changed nothing still signals.',
          '  2. Discard what you did not mean to keep (`git restore` / `git clean`) so the tree is clean either way.',
        ].join('\n'),
      );
    }
  }

  // Object holder (not a bare `let`): the flag is assigned inside the update callback, which
  // TypeScript's flow analysis cannot see — a bare boolean would read as always-false.
  //
  // It carries the CHAIN DETAIL as well as the flag, because a spent chain is the one halt route
  // that leaves nothing to read: the signalling item stays `complete` (only an environment wall
  // marks it `failed`), so with no reason passed to questBlockOnFailureBroker the quest goes
  // `blocked` with every row green and no `errorMessage` anywhere naming why.
  const blockedOnSpentPtChain: { value: boolean; reason?: ErrorMessage } = { value: false };
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

      // Duplicate-on-partial: append "pt N: {text}" right after the completed item. Locked
      // (verify tail) roles are bounded — a spent pt chain blocks instead of looping forever.
      const needsContinuation = operationStatus === 'partial' || isEnvironmentWall;
      const { base, chainLength } = operationPtChainTransformer({
        operations: quest.operations,
        item: linkedOperation,
      });
      const maxAttempts = ((): typeof slotManagerStatics.codeweaver.maxAttempts | undefined => {
        const role: OperationItem['role'] = linkedOperation.role;
        // A COMMAND role never reaches this ladder honestly: it is terminal by exit code and never
        // calls signal-back, and its retry chain is counted by its own broker against
        // `slotManagerStatics.<role>.maxRetries`. Matching the whole command subset rather than
        // `ward` alone is what keeps a later command role out of the ladder's final `else`, which
        // would otherwise hand it spiritmender's budget.
        if (isChatWorkItemRoleGuard({ role }) || isCommandWorkItemRoleGuard({ role })) {
          return undefined;
        }
        const budgets = slotManagerStatics;
        return role === 'codeweaver'
          ? budgets.codeweaver.maxAttempts
          : role === 'flowrider'
            ? budgets.flowrider.maxAttempts
            : role === 'siegemaster'
              ? budgets.siegemaster.maxAttempts
              : role === 'warpgate'
                ? budgets.warpgate.maxAttempts
                : budgets.spiritmender.maxAttempts;
      })();
      // The pt budget gates `partial` only. An environment wall always appends its continuation:
      // the quest blocks either way, and withholding the append would leave the operation with no
      // pending item, so a resume would silently skip this scope entirely.
      const chainSpent =
        operationStatus === 'partial' &&
        linkedOperation.locked &&
        maxAttempts !== undefined &&
        chainLength >= maxAttempts;

      if (chainSpent) {
        blockedOnSpentPtChain.value = true;
        blockedOnSpentPtChain.reason = errorMessageContract.parse(
          `${linkedOperation.role} pt chain for "${String(base)}" is spent: ${String(chainLength)} attempt(s) signalled 'partial' against a budget of ${String(maxAttempts)}. The remaining scope is on the last 'pt' operation item; a resume re-dispatches it.`,
        );
        return { operations: completedOperations, workItems: nextWorkItems };
      }

      // `flowIds` AND `packageNames` ride along with the role and lock. Both carry scope: a
      // flow-sliced item (flowrider/siegemaster) whose continuation lost its flows, or a
      // package-sliced item (codeweaver) whose continuation lost its packages, hands the fresh
      // session no slice at all — so it silently works the whole quest instead of the remainder
      // the `partial` was about.
      const continuations = needsContinuation
        ? [
            operationItemContract.parse({
              id: crypto.randomUUID(),
              role: linkedOperation.role,
              text: `pt ${String(chainLength + 1)}: ${base}`,
              status: 'pending',
              locked: linkedOperation.locked,
              flowIds: linkedOperation.flowIds,
              packageNames: linkedOperation.packageNames,
              ...(linkedOperation.wardMode === undefined
                ? {}
                : { wardMode: linkedOperation.wardMode }),
            }),
          ]
        : [];

      const insertIndex =
        completedOperations.findIndex((operation) => operation.id === linkedOperation.id) + 1;

      return {
        operations: [
          ...completedOperations.slice(0, insertIndex),
          ...continuations,
          ...completedOperations.slice(insertIndex),
        ],
        workItems: nextWorkItems,
      };
    },
  });

  // Both halt routes drain pending work items and flip the quest to `blocked`; neither advances,
  // because the next session would hit the very wall (or spent budget) that stopped this one.
  if (blockedOnSpentPtChain.value || isEnvironmentWall) {
    // An environment wall already carries its `blockedReason` on the work item's `errorMessage`,
    // written in the persist above. A spent chain has no such carrier, so its reason is supplied
    // here — otherwise `blocked` is the only thing the user is told.
    const { reason } = blockedOnSpentPtChain;
    await questBlockOnFailureBroker({
      questId,
      failedWorkItemId: workItemId,
      ...(reason === undefined ? {} : { reason }),
    });
    return adapterResultContract.parse({ success: true });
  }

  await questAdvanceBroker({ questId });

  return adapterResultContract.parse({ success: true });
};
