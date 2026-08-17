/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated. `complete` is
 * the sole signal kind (session-terminal marker); the operation OUTCOME rides on the call as
 * `operationStatus` and is applied here server-side (authoritative — an agent cannot forget to
 * patch the ledger, because agents never write the ledger at all):
 *
 * - `operationStatus: 'done'` (or absent) → the linked operation item is marked `complete`. For a
 *   `flowrider`, `groundstomper` or `siegemaster` item this is GATED: the responder recomputes the
 *   signalling role's own scope — the flow graph's verification units measured against THAT role's
 *   sign-off track (`flowriderSignoff` / `siegemasterSignoff`) — and refuses `done` (by throwing,
 *   so the agent sees why) while any unit carries no sign-off on that track. Completion is a
 *   computed fact rather than the agent's recollection of its own pass. The two sign-off FIELDS are
 *   INDEPENDENT: neither reads the other's, so one unit can be outstanding for one and settled for
 *   the other — and the three DENOMINATORS over them are disjoint, Flowrider and Groundstomper
 *   splitting `flowriderSignoff` by package kind. Both verdicts clear a unit — `confirmed` and
 *   `unconfirmable` alike — so the gate is always satisfiable honestly; it refuses absence, not
 *   honesty. An item held by any of the five orchestrator roles is additionally gated PER UNIT on
 *   REVIEW COVERAGE: the responder rebuilds the standards-review checklist over
 *   `<the item's recorded startRef>..HEAD` — every commit this item made, across all its rounds —
 *   and refuses `done` while any unit carries no `planningNotes.blightLedger` disposition. Every
 *   disposition clears a unit, `gap` and `recorded` exactly as `reviewed`, so this gate too refuses
 *   absence rather than honesty.
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
import { questGetBlightChecklistBroker } from '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questOperationsUpdateBroker } from '../../../brokers/quest/operations-update/quest-operations-update-broker';
import { blightCoverageOutstandingTransformer } from '../../../transformers/blight-coverage-outstanding/blight-coverage-outstanding-transformer';
import { operationPtChainTransformer } from '../../../transformers/operation-pt-chain/operation-pt-chain-transformer';
import { signoffOutstandingTransformer } from '../../../transformers/signoff-outstanding/signoff-outstanding-transformer';
import { roleToDisciplineStatics } from '../../../statics/role-to-discipline/role-to-discipline-statics';
import { signoffTrackEligibilityStatics } from '../../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

// How many outstanding unit ids (or dirty paths) to name inline before deferring to the tool that
// lists the rest. Enough to act on directly for a nearly-finished flow or diff, short of dumping
// 144 ids into a tool error.
const OUTSTANDING_PREVIEW_LIMIT = 15;

// The five roles that run a planner/worker/reviewer round over an operation item. Read from
// `roleToDisciplineStatics` rather than listed here, so a role added to that map is covered by both
// gates below the day it is added — the same reason `isChatWorkItemRoleGuard` reads
// `workItemRoleStatics.chat` instead of growing an `||` chain.
const ORCHESTRATOR_ROLES = Object.keys(
  roleToDisciplineStatics,
) as readonly (keyof typeof roleToDisciplineStatics)[];

// Whose `done` is gated on their round's output being reviewed unit by unit. Membership, not a name
// chain: a role that runs a review round is a role whose round has to be covered.
const REVIEWED_ROLES: ReadonlySet<OperationItem['role']> = new Set(ORCHESTRATOR_ROLES);

// Every role whose session ends by CHANGING CODE, and therefore owes a commit before it signals.
// The five orchestrator roles plus the two bespoke-prompt workers that also write code and commit.
// Both COMMAND roles (`workItemRoleStatics.command` — `ward`, `riftcarver`) are absent because they
// are terminal by exit code and never reach signal-back at all; every chat role is absent because a
// conversation produces a spec, not a commit.
const CODE_CHANGING_ROLES: ReadonlySet<OperationItem['role']> = new Set([
  ...ORCHESTRATOR_ROLES,
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
  // The resolution is taken ONCE, here, and read again by the review-coverage gate below: both
  // measure the same checkout, and resolving twice would load the quest a second time to answer a
  // question already answered. `undefined` means the signalling role owes no git measurement at
  // all, which is why the review gate can key on `?.kind` without repeating the role test.
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

  // COMPLETION GATE — likewise runs BEFORE any mutation, so a refused `done` persists nothing.
  //
  // `done` from a flowrider, groundstomper or siegemaster item means "every verification unit in my
  // scope carries MY track's sign-off". A session's memory of its own coverage is precisely what
  // fails: a pass walks part of its scope across a long serial run and reports done. The claim is
  // therefore recomputed here from the flow graph, read against the signalling role's own sign-off
  // field.
  //
  // ONE call covers ALL THREE verification denominators. `signoffOutstandingTransformer` keys on the
  // linked item's role internally (flowrider and groundstomper → `flowriderSignoff` over disjoint
  // package kinds, siegemaster → `siegemasterSignoff`, every other role → nothing outstanding), so a
  // second per-track branch here would only restate what it already decides — and the denominators
  // are independent, so the same unit can be outstanding for one and settled for another.
  //
  // Both verdicts clear a unit — `confirmed` and `unconfirmable` alike — so the gate is always
  // satisfiable honestly; what it refuses is scope with no sign-off at all.
  //
  // Throwing (rather than returning) is deliberate and matches the unloadable-quest case above: the
  // error rides the awaited signal-back path back through the MCP tool to the agent, where it is
  // visible and actionable, instead of being silently swallowed as a success.
  if (operationStatus === undefined || operationStatus === 'done') {
    const linkedOperation = gatedOperation;

    if (linkedOperation !== undefined) {
      const outstanding = signoffOutstandingTransformer({
        quest: result.quest,
        operationItem: linkedOperation,
      });

      if (outstanding.length > 0) {
        // The signalling role IS the DENOMINATOR track, and `signoffTrackEligibilityStatics` is what
        // maps that to the ONE field it writes. Two lookups, not one: the tool call has to name the
        // denominator (there are three) so the session reads back the set this gate just measured,
        // while the remedy has to name the field (there are two) so it writes to the right column.
        // Groundstomper is where they differ — it writes `flowriderSignoff` over the package kinds
        // Flowrider does NOT measure, so naming `flowrider` in the tool call would hand it the exact
        // complement of its own remainder.
        const track =
          linkedOperation.role === 'groundstomper' || linkedOperation.role === 'siegemaster'
            ? linkedOperation.role
            : 'flowrider';
        const { signoffField } = signoffTrackEligibilityStatics.byTrack[track];
        // The item's own slice rides along, because the gate narrowed by it and the tool will not
        // unless it is asked to. A reproduction call missing it reads the whole quest.
        const packageArg =
          linkedOperation.packageNames.length === 0
            ? ''
            : `, packageNames: [${linkedOperation.packageNames.map((name) => `'${String(name)}'`).join(', ')}]`;
        const checklistTool = `get-qa-checklist({ track: '${track}'${packageArg} })`;

        throw new Error(
          [
            `signal-back refused: operationStatus 'done' means every verification unit in your scope carries YOUR OWN track's sign-off (\`${signoffField}\`), and ${String(outstanding.length)} still carry none. The other track is measured separately and is never read here, so its sign-offs cannot settle yours. Read the same list back with ${checklistTool}.`,
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
            `  1. Write a \`${signoffField}\` on each remaining unit via modify-quest — \`confirmed\` with \`evidence\` (a test file:line plus what makes that test fail, or the value you measured off the running system), or \`unconfirmable\` with \`evidence\` of what you tried and why it was out of reach plus a \`question\` someone else can pick up. BOTH verdicts clear this gate; what it refuses is the ABSENCE of a sign-off, never an honest one.`,
            '     BATCH the writes: ONE modify-quest call carrying many sign-offs, never one call per unit.',
            "  2. Signal operationStatus: 'partial' instead, which hands the named remainder to a fresh session of your role.",
            '     A unit you genuinely cannot close is `unconfirmable`, not pt work — pt-chaining a permanently unprovable unit only burns the chain to its maxAttempts and blocks the quest.',
          ].join('\n'),
        );
      }

      // REVIEW-COVERAGE GATE — the same PER-UNIT shape as the sign-off gate above, over the
      // standards-review surface instead of the flow graph. Every changed file this work item
      // committed, crossed with each applicable concern, has to carry a disposition in
      // `planningNotes.blightLedger`; `done` is refused while any unit carries none.
      //
      // THE RANGE IS WHAT MAKES IT MEASURABLE. An orchestrator commits once per ROUND, so at signal
      // time the tree is clean by construction — a `working-tree` reading is empty, and a `commit`
      // one sees only the LAST of several round commits. Neither can measure a whole item. What can
      // is `<the item's own recorded startRef>..HEAD`: the fork point stamped by
      // `agentPromptGetBroker` the first time this item was served its prompt, never moved
      // afterwards, so the range covers every round the item ran rather than the one it ended on.
      //
      // Coverage is cumulative and per UNIT, not per author: a file first reviewed in round 1 and
      // touched again in round 3 keys on the same `<implPath>:<concern>` id, so the round-1
      // disposition still clears it. The gate measures whether the surface was reviewed, never who
      // reviewed it.
      //
      // FOUR states SKIP rather than refuse, and each is real. No recorded `startRef` (a hydrated
      // quest, an item that predates the field, an item whose worktree never resolved) leaves no
      // range to measure; no worktree resolving leaves no checkout to measure it in; no pinned
      // `baseRef` marks a quest seeded before the review base existed at all. An EMPTY range is the
      // fourth and it PASSES honestly rather than skipping — a round that committed nothing has
      // nothing to review, which is the same reading `git commit --allow-empty` gets from the
      // commit gate above.
      //
      // It is a gate rather than a prompt line for the reason the post-mortem measured directly:
      // the computed `scope: 'commit'` parameter was passed correctly 30 times out of 30 because a
      // named consequence was bolted to it, while the prose instruction to "record dispositions as
      // you go" was ignored 13 times out of 13. A concern that lives only in a prompt is skipped.
      if (
        REVIEWED_ROLES.has(linkedOperation.role) &&
        resolution?.kind === 'worktree' &&
        signaledItem.startRef !== undefined &&
        result.quest.baseRef !== undefined
      ) {
        const checklist = await questGetBlightChecklistBroker({
          questId,
          scope: 'since-ref',
          sinceRef: signaledItem.startRef,
        });
        const outstandingUnits = blightCoverageOutstandingTransformer({ checklist });

        if (outstandingUnits.length > 0) {
          const reviewerCall = `get-blight-checklist({ questId: '${String(questId)}', scope: 'working-tree' })`;

          throw new Error(
            [
              `signal-back refused: operationStatus 'done' means every review unit your commits produced carries a disposition in \`quest.planningNotes.blightLedger\`, and ${String(outstandingUnits.length)} still carry none. The surface measured is \`${String(signaledItem.startRef)}..HEAD\` — every commit THIS work item made, across all of its rounds, not just the last one.`,
              '',
              'Outstanding units:',
              ...outstandingUnits
                .slice(0, OUTSTANDING_PREVIEW_LIMIT)
                .map((id) => `  - ${String(id)}`),
              ...(outstandingUnits.length > OUTSTANDING_PREVIEW_LIMIT
                ? [
                    `  … and ${String(outstandingUnits.length - OUTSTANDING_PREVIEW_LIMIT)} more — the reviewer-minion's own ${reviewerCall} enumerates its round's share of them.`,
                  ]
                : []),
              '',
              'Do ONE of these, then signal again:',
              `  1. Dispatch a \`reviewer-minion\` over the output this round produced. It calls \`${reviewerCall}\` for its own scope and writes each verdict to \`quest.planningNotes.blightLedger\` via modify-quest.`,
              '     EVERY disposition clears a unit — `gap` and `recorded` with a real reason count exactly as `reviewed` does. This gate refuses ABSENCE, not honesty.',
              '     A unit listed above that no round of yours touched belongs to an earlier round of THIS item; the same reviewer clears it, because a disposition is keyed on the unit and not on who wrote it.',
              "  2. Signal operationStatus: 'partial' instead, which hands the un-reviewed remainder to a fresh session of your role.",
            ].join('\n'),
          );
        }
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
            : role === 'groundstomper'
              ? budgets.groundstomper.maxAttempts
              : role === 'siegemaster'
                ? budgets.siegemaster.maxAttempts
                : role === 'pesteater'
                  ? budgets.pesteater.maxAttempts
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
        return { operations: completedOperations, workItems: nextWorkItems };
      }

      // `flowIds` AND `packageNames` ride along with the role and lock. Both carry scope: a
      // flow-scoped item (siegemaster/groundstomper) whose continuation lost its flows, or a
      // package-sliced item (codeweaver/flowrider) whose continuation lost its packages, hands the
      // fresh session no slice at all — so it silently works the whole quest instead of the
      // remainder the `partial` was about.
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
    await questBlockOnFailureBroker({ questId, failedWorkItemId: workItemId });
    return adapterResultContract.parse({ success: true });
  }

  await questAdvanceBroker({ questId });

  return adapterResultContract.parse({ success: true });
};
