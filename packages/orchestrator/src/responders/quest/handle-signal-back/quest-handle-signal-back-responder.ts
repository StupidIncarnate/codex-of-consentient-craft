/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated. `complete` is
 * the sole signal kind (session-terminal marker); the operation OUTCOME rides on the call as
 * `operationStatus` and is applied here server-side (authoritative — an agent cannot forget to
 * patch the ledger, because agents never write the ledger at all):
 *
 * - `operationStatus: 'done'` (or absent) → the linked operation item is marked `complete`. For a
 *   `flowrider`, `groundstomper` or `siegemaster` item, or a `blightscout` item, this is GATED: the
 *   responder recomputes the signalling role's own scope — the flow graph's verification units
 *   measured against THAT role's sign-off track (`flowriderSignoff` / `siegemasterSignoff`), or the
 *   LAST COMMIT's blight checklist (blightscout, via questGetBlightChecklistBroker) — and refuses
 *   `done` (by throwing, so the agent sees why) while any unit carries no sign-off on that track /
 *   no entry in `quest.planningNotes.blightLedger` respectively. Completion is a computed fact
 *   rather than the agent's recollection of its own pass. The two sign-off FIELDS are INDEPENDENT:
 *   neither reads the other's, so one unit can be outstanding for one and settled for the other —
 *   and the three DENOMINATORS over them are disjoint, Flowrider and Groundstomper splitting
 *   `flowriderSignoff` by package kind. Both verdicts clear a unit — `confirmed` and
 *   `unconfirmable` alike — as does every blight disposition, so the gate is always satisfiable
 *   honestly; it refuses absence, not honesty.
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
 * On `done` and `partial` alike — the two outcomes that leave a commit behind and let the quest
 * carry on — a `blightscout` operation item AND its linked work item are appended immediately after
 * the completed item, ahead of any pt continuation, so the standards review of that commit is the
 * next thing dispatched. Which roles earn one is MEMBERSHIP in
 * `blightscoutOperationStatics.committingRoles`, and `blightscout`'s absence from that list is what
 * makes the append terminate. `blocked` and a spent pt chain append no review: both halt the quest,
 * so the scout would only be drained to `skipped`. The review's text NAMES the operation item it
 * follows, so each one is its own pt chain carrying its own `maxAttempts` budget — one budget per
 * COMMIT, which is the scope a scout is dispatched against.
 *
 * Work-item-terminal + operation-complete + the optional pt N + the optional scout (operation AND
 * work item together) land in ONE persist (questOperationsUpdateBroker), so a crash is
 * all-or-nothing; afterwards questAdvanceBroker creates the next work item. Agents have no failure
 * signal for work they could have done — they fix their own problems and move forward; the only
 * other failure concept is a ward exit-code red, handled in quest-run-ward-broker.
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

import { questAdvanceBroker } from '../../../brokers/quest/advance/quest-advance-broker';
import { questBlockOnFailureBroker } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questGetBlightChecklistBroker } from '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker';
import { questOperationsUpdateBroker } from '../../../brokers/quest/operations-update/quest-operations-update-broker';
import { blightCoverageOutstandingTransformer } from '../../../transformers/blight-coverage-outstanding/blight-coverage-outstanding-transformer';
import { operationPtChainTransformer } from '../../../transformers/operation-pt-chain/operation-pt-chain-transformer';
import { signoffOutstandingTransformer } from '../../../transformers/signoff-outstanding/signoff-outstanding-transformer';
import { blightscoutOperationStatics } from '../../../statics/blightscout-operation/blightscout-operation-statics';
import { signoffTrackEligibilityStatics } from '../../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

// How many outstanding unit ids to name inline before deferring to get-qa-checklist / the blight
// equivalent. Enough to act on directly for a nearly-finished flow or diff, short of dumping 144
// ids into a tool error.
const OUTSTANDING_PREVIEW_LIMIT = 15;

// Whether a completing operation item earns a standards review is decided by MEMBERSHIP here, not
// by a role-name chain below — the same way `relayTailFanOutTransformer` reads `fanOutBy` off a
// registry entry instead of matching seed roles, and `isChatWorkItemRoleGuard` reads
// `workItemRoleStatics.chat` instead of an `||` chain. `blightscout` is deliberately NOT a member;
// see the append site for why that absence is the relay's termination proof.
const COMMITTING_ROLES: ReadonlySet<OperationItem['role']> = new Set(
  blightscoutOperationStatics.committingRoles,
);

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
  // `done` from a flowrider, groundstomper or siegemaster item means "every verification unit in my
  // scope carries MY track's sign-off"; `done` from a blightscout item means "every
  // changed-file/concern unit in the commit I was dispatched against has been dealt with". A
  // session's memory of its own coverage is precisely what fails: a pass walks part of its scope
  // across a long serial run and reports done. Both claims are therefore recomputed here — the flow
  // graph read against the signalling role's own sign-off field for the three verification
  // denominators, the single-commit git diff (via questGetBlightChecklistBroker) + blightLedger for
  // blightscout.
  //
  // ONE call covers ALL THREE verification denominators. `signoffOutstandingTransformer` keys on the
  // linked item's role internally (flowrider and groundstomper → `flowriderSignoff` over disjoint
  // package kinds, siegemaster → `siegemasterSignoff`, every other role → nothing outstanding), so a
  // second per-track branch here would only restate what it already decides — and the denominators
  // are independent, so the same unit can be outstanding for one and settled for another.
  //
  // Both sign-off verdicts clear a unit — `confirmed` and `unconfirmable` alike — as does every
  // blight disposition, `gap` and `recorded` included, so the gate is always satisfiable honestly;
  // what it refuses is scope with no sign-off at all. An operation item is never both a verification
  // track and blightscout, so at most one of the two transformers below ever contributes.
  //
  // The blight branch is gated on the linked operation's role so a git diff does not run on every
  // signal-back from every role — only a blightscout item ever calls questGetBlightChecklistBroker.
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
      // A scout is measured over its OWN COMMIT, never the whole quest diff — that narrowing is the
      // point of the role, and passing the quest scope here would refuse `done` until one session
      // had dispositioned every file every session had ever touched.
      const isBlightscout = linkedOperation.role === 'blightscout';
      const blightChecklist = isBlightscout
        ? await questGetBlightChecklistBroker({ questId, scope: 'commit' })
        : null;
      const blightOutstanding = blightCoverageOutstandingTransformer({
        operationItem: linkedOperation,
        checklist: blightChecklist,
      });
      const outstanding = [...signoffOutstanding, ...blightOutstanding];

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
        const checklistTool = isBlightscout
          ? "get-blight-checklist({ scope: 'commit' })"
          : `get-qa-checklist({ track: '${track}'${packageArg} })`;

        const headline = isBlightscout
          ? `signal-back refused: operationStatus 'done' means every review unit in the commit you were dispatched against carries a disposition, and ${String(outstanding.length)} still carry none.`
          : `signal-back refused: operationStatus 'done' means every verification unit in your scope carries YOUR OWN track's sign-off (\`${signoffField}\`), and ${String(outstanding.length)} still carry none. The other track is measured separately and is never read here, so its sign-offs cannot settle yours. Read the same list back with ${checklistTool}.`;

        const remedy = isBlightscout
          ? [
              '  1. Deal with each remaining unit and record it in quest.planningNotes.blightLedger (a `gap` or `recorded` entry with a real reason counts — this gate refuses absence, not honesty).',
              "  2. Signal operationStatus: 'partial' instead, which hands the named remainder to a fresh session of your role.",
            ]
          : [
              `  1. Write a \`${signoffField}\` on each remaining unit via modify-quest — \`confirmed\` with \`evidence\` (a test file:line plus what makes that test fail, or the value you measured off the running system), or \`unconfirmable\` with \`evidence\` of what you tried and why it was out of reach plus a \`question\` someone else can pick up. BOTH verdicts clear this gate; what it refuses is the ABSENCE of a sign-off, never an honest one.`,
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
                : role === 'blightscout'
                  ? budgets.blightscout.maxAttempts
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

      // BLIGHTSCOUT AUTO-APPEND — the standards review is minted NEXT TO the work it reviews rather
      // than batched behind the whole quest. Its scope is `HEAD~1...HEAD`, which is why it is
      // inserted AHEAD of the pt continuation below and not after it: let the continuation run
      // first and HEAD~1 has already moved on to the continuation's own commit, leaving the commit
      // this scout was minted for permanently unreviewed.
      //
      // Eligibility is MEMBERSHIP in `blightscoutOperationStatics.committingRoles` (hoisted into
      // COMMITTING_ROLES above) — this responder matches no role name at all, so teaching a new
      // role to earn a review is an edit to that static.
      //
      // TERMINATION IS STRUCTURAL: `blightscout` is not a member of that set, so a scout going
      // complete can never mint another scout. The relay therefore appends at most ONE review per
      // committing session and cannot recurse. The static's colocated test pins that absence
      // directly, so it survives a well-meaning edit to the list.
      //
      // It fires on `partial` as well as `done`: a partial session still landed a real commit, and
      // the scout's scope is `HEAD~1...HEAD` either way. A session that in fact committed nothing
      // costs one cheap scout — it lands on the PREVIOUS commit, whose units already carry
      // dispositions, so `remainingItemIds` comes back empty and it signals `done` immediately.
      // That self-correction is exactly why no sha is persisted anywhere (see
      // quest-get-blight-checklist-broker).
      //
      // It does NOT fire on `blocked`, nor on the spent-chain halt above. Both halt the quest
      // through questBlockOnFailureBroker, which drains pending work items to `skipped` — the scout
      // would be born dead, and `skipped` never satisfies `dependsOn`. Nothing is lost: the resume
      // re-dispatches the same scope, and THAT session's outcome mints the review.
      const scoutOperationId =
        !isEnvironmentWall && COMMITTING_ROLES.has(linkedOperation.role)
          ? crypto.randomUUID()
          : undefined;

      const scoutOperations =
        scoutOperationId === undefined
          ? []
          : [
              operationItemContract.parse({
                id: scoutOperationId,
                role: 'blightscout',
                // The text NAMES the operation item whose session made the commit, which is what
                // gives each review its OWN pt chain and therefore its own
                // `slotManagerStatics.blightscout.maxAttempts` budget — the per-COMMIT budget this
                // role is scoped to. Sharing one sentence across a quest's scouts collapses them
                // into a single chain, and the fourth review to come back `partial` — an ordinary
                // outcome for five concerns over a commit — then trips the spent-budget halt below
                // and blocks a quest with its whole verify tail still pending. Same device, same
                // reason, as `relayTailFanOutTransformer`'s `— flow: <id>` suffix.
                //
                // The id is the handle because it alone is unique per commit AND unchanged by this
                // scout's own `pt N` continuation (which copies the base text): a sibling's TEXT
                // can repeat, two ward reds appending two spiritmender items being the standing
                // case. The role rides along so the ledger line says whose commit is under review
                // rather than only which uuid.
                text: blightscoutOperationStatics.textTemplate.replace(
                  blightscoutOperationStatics.placeholders.reviewedOperation,
                  `${linkedOperation.role} ${String(linkedOperation.id)}`,
                ),
                status: 'pending',
                // `locked` enrols the review in `slotManagerStatics.blightscout.maxAttempts`. The
                // deliberate contrast is the codeweaver item, minted UNLOCKED precisely so its pt
                // chain stays UNBOUNDED — the flows are the acceptance target and that work has to
                // land. A review is not the acceptance target, so a scout that cannot settle one
                // commit in three passes is a halt worth surfacing rather than a loop worth
                // continuing.
                locked: true,
                // A commit is not a slice of the spine. `get-blight-checklist({ scope: 'commit' })`
                // derives every unit from the diff alone, so copying the signalling item's flowIds
                // or packageNames onto the scout would advertise a narrowing the checklist never
                // applies.
                flowIds: [],
              }),
            ];

      const scoutWorkItems =
        scoutOperationId === undefined
          ? []
          : [
              workItemContract.parse({
                id: crypto.randomUUID(),
                role: 'blightscout',
                status: 'pending',
                spawnerType: 'agent',
                // Minted WITH its operation, in this same persist, for the reason the warpgate
                // append states: questAdvanceBroker's strict-1:1 resume guard skips a pending
                // operation that already carries a linked work item, so no re-entrant scan can mint
                // a second one. An operation appended alone is exactly what that scan would pick up.
                relatedDataItems: [`operations/${scoutOperationId}`],
                // Chained after the session whose commit it reviews — the OPPOSITE call from
                // warpgate's `dependsOn: []`, for the opposite reason. A merge is a fresh top-level
                // dispatch on a finished quest whose trailing work items are `skipped`, and skipped
                // never satisfies `dependsOn`. A scout is the very next relay step after a session
                // going terminal as `complete` in this same persist, so naming it is both
                // satisfiable and load-bearing: unchained, the scout is dispatchable alongside the
                // work it exists to review.
                dependsOn: [workItemId],
                maxAttempts: 1,
                createdAt: completedAt,
              }),
            ];

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
          ...scoutOperations,
          ...continuations,
          ...completedOperations.slice(insertIndex),
        ],
        workItems: [...nextWorkItems, ...scoutWorkItems],
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
