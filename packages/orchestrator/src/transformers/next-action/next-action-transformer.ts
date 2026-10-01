/**
 * PURPOSE: Given a quest and one scope, decides what runs next — the four questions, in the one order
 * that makes them an engine. Reach for this over `questGetNextStepBroker` by LEVEL and by PURITY:
 * that broker scans every quest and performs a dispatch, where this answers for ONE operation item,
 * takes no lock, does no I/O and returns a decision nobody has acted on yet.
 *
 * USAGE:
 * nextActionTransformer({ quest, plan, operationItemId, agentFlowStatics, questFlowStatics });
 * // Returns: NextAction
 *
 * THE ORDER OF THE FOUR QUESTIONS IS THE ENGINE. A request beats an `unmet`; an `unmet` beats an
 * unstarted batch; an unstarted batch beats `routes.done`. Get it wrong and the symptoms are subtle —
 * work that should have been re-cut is skipped, or a phase advances with pieces still unstarted.
 *
 * THE CURRENT STEP IS THE STEP OF THE LAST WORK ITEM ON THIS SCOPE, by ARRAY order — never
 * `createdAt`, since a parallel batch is minted inside one persist and shares a timestamp. A scope
 * whose current step has no work item at all has not entered it yet, so the router mints that step
 * rather than folding an outcome nothing produced; that mint carries `cause: 'plan-batch'`, which is
 * the step's own work whether or not a planner cut pieces for it.
 *
 * THE PHASE RULE IS QUESTION 3 DOING ITS JOB. A step's `done` fires only once every piece at that
 * step has DRAINED, so a `pending` or `in_progress` item at the current step holds question 4 back
 * and the answer is `cause: 'capped'` — neither done nor blocked, come back. For siege that is what
 * makes `happyWalk → adversarial` mean something: every happy piece has recorded before the first
 * attack is minted, so an antagonist's baseline exists by the time the router mints it.
 *
 * GROUPING KEYS ON THE ORIGINATING PIECE, NEVER THE MARK SET. `claimedBy` is built by walking the
 * plan's batches, then each batch's pieces, then each piece's `assignedUnitIds`, all in declaration
 * order, writing only where the key is absent — first write wins, and the plan file's own order is
 * the only ordering anyone can read back off disk. `contextUnitIds` are NOT claims: a seam's far half
 * sits on the earlier cell as context and must not pull a re-mint onto it. A unit no piece claimed
 * gets its own group with no `pieceId` and no `payload` — that is the reviewer's whole job, and there
 * is no originating piece to copy a brief from.
 *
 * THE RETURN EDGE IS AUTOMATIC AND `routes.done` IS THE FORWARD EDGE ONLY. A step that is only ever
 * mark-minted declares no `done` route at all, and an undeclared outcome returns to the work item
 * `mintedBy` names — as a FRESH work item at that minter's step, never a resume of the minter's own.
 * No `mintedBy` and no route for the outcome is `reason: 'no-minter'`: not a stall, and not a silent
 * pass.
 *
 * A PLAIN DECLARED-ROUTE MINT (QUESTION 4's forward edge) ALSO STAMPS `mintedBy` — naming the step's
 * own current terminal item — WHENEVER THE TARGET STEP DECLARES NO `done` ROUTE OF ITS OWN. `ward`
 * (`kind: 'deterministic'`) mints with `assignedUnitIds: []`, so its `unmet` route to `repair` never
 * takes question 2's mark-mint branch (there is no per-unit mark to group by) — it is a plain forward
 * route, exactly like `work`'s `done` route to `review`. The two differ only in what the TARGET
 * declares: `review` has its own `done`/`unmet` routes and never needs a minter back; `repair` (and
 * `fixHappy`/`fixAdversarial`) declare no `done` route at all and rely ENTIRELY on the return edge to
 * get back to the gate that routed them in. Stamping `mintedBy` only where the target lacks `done`
 * keeps a target that DOES declare one free to hit `no-minter` on a genuine gap in its own route
 * table, rather than silently absorbing it into an unintended return.
 *
 * THIS FILE TAKES NO LOCK, EVER. `questWithModifyLockBroker` is deliberately non-reentrant and
 * wrapping a write in it deadlocks that questId, so the router is pure and synchronous and its caller
 * reads the plan BEFORE it enters the lock — which is also why `plan` arrives as an argument rather
 * than being read here.
 *
 * `request`, `headSha`, `declaredWord` AND `hitWall` ARRIVE AS ARGUMENTS for the same reason
 * `deriveOutcomeTransformer` takes `declaredWord` and `hitWall`: the work tool and the worktree hold
 * them, and a pure function cannot go and look. `request` carries its own asker, because the minted
 * step's `done` returns to the session that asked for it. `headSha` is the worktree's HEAD, which
 * `mintNextActionTransformer` compares against a `requiresProgress` step's last `startRef`.
 */

import type { Quest, WorkItem, OperationItem } from '@dungeonmaster/shared/contracts';
import { qaChecklistItemContract } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { mintedWorkItemContract } from '../../contracts/minted-work-item/minted-work-item-contract';
import { nextActionContract } from '../../contracts/next-action/next-action-contract';
import type { NextAction } from '../../contracts/next-action/next-action-contract';
import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';
import type { WorkPlan } from '../../contracts/work-plan/work-plan-contract';
import { deriveOutcomeTransformer } from '../derive-outcome/derive-outcome-transformer';
import { foldOutcomesTransformer } from '../fold-outcomes/fold-outcomes-transformer';
import { mintNextActionTransformer } from '../mint-next-action/mint-next-action-transformer';
import { stepEntryBatchTransformer } from '../step-entry-batch/step-entry-batch-transformer';
import { stepInScopeUnitsTransformer } from '../step-in-scope-units/step-in-scope-units-transformer';
import { unitCurrentMarkTransformer } from '../unit-current-mark/unit-current-mark-transformer';
import { unmetBatchLayerTransformer } from './unmet-batch-layer-transformer';

export const nextActionTransformer = ({
  quest,
  plan,
  operationItemId,
  agentFlowStatics,
  questFlowStatics,
  request,
  headSha,
  declaredWord,
  hitWall,
}: {
  quest: Quest;
  plan: WorkPlan | null;
  operationItemId: OperationItem['id'];
  agentFlowStatics: Readonly<
    Record<
      string,
      | {
          entry: string;
          steps: Readonly<
            Record<
              string,
              | {
                  role: string;
                  kind: string;
                  requiresProgress?: boolean;
                  routes: Readonly<Record<string, string | undefined>>;
                  needsLane?: boolean;
                  maxConcurrent?: { limit: number; counts: string };
                }
              | undefined
            >
          >;
        }
      | undefined
    >
  >;
  questFlowStatics: Readonly<
    Record<string, { families: Readonly<Record<string, { role: string } | undefined>> } | undefined>
  >;
  request?: { fromWorkItemId: WorkItem['id']; step: string; reason: string };
  headSha?: string;
  declaredWord?: StepOutcome;
  hitWall?: boolean;
}): NextAction => {
  const operationItem = quest.operations.find((item) => item.id === operationItemId);

  if (operationItem === undefined) {
    throw new Error(
      `nextActionTransformer: quest '${String(quest.id)}' holds no operation item '${String(operationItemId)}'`,
    );
  }

  const questFlow = questFlowStatics[quest.questType];

  if (questFlow === undefined) {
    throw new Error(
      `nextActionTransformer: questFlowStatics declares no '${quest.questType}' quest type — it holds: ${Object.keys(questFlowStatics).join(', ')}`,
    );
  }

  // The family KEY, not the role: `wardFull` carries `role: 'ward'`, so the ledger's role is what a
  // caller has and the key is what both graphs are keyed on.
  const familyEntry = Object.entries(questFlow.families).find(
    (entry) => entry[1] !== undefined && entry[1].role === operationItem.role,
  );

  if (familyEntry === undefined) {
    throw new Error(
      `nextActionTransformer: no family in questFlowStatics.${quest.questType}.families carries role '${operationItem.role}' — the families are: ${Object.keys(questFlow.families).join(', ')}`,
    );
  }

  const [family] = familyEntry;
  const graph = agentFlowStatics[family];

  if (graph === undefined) {
    throw new Error(
      `nextActionTransformer: agentFlowStatics declares no '${family}' step graph — it holds: ${Object.keys(agentFlowStatics).join(', ')}`,
    );
  }

  const scopeRef = `operations/${String(operationItemId)}`;
  const scopeItems = quest.workItems.filter((item) =>
    item.relatedDataItems.some((ref) => String(ref) === scopeRef),
  );

  // ARRAY order, never `createdAt` — a parallel batch is minted inside one persist and shares a
  // timestamp, so a sort over it is unstable. `unitCurrentMarkTransformer` reads the ledger the same
  // way and for the same reason.
  const lastStepped = [...scopeItems].reverse().find((item) => item.step !== undefined);
  const step = lastStepped?.step ?? graph.entry;
  const node = graph.steps[step];

  if (node === undefined) {
    return nextActionContract.parse({
      kind: 'block',
      operationItemId,
      family,
      step,
      reason: 'unknown-step',
      message:
        `step \`${step}\` is not declared in family \`${family}\` — ` +
        `agentFlowStatics.${family}.steps holds: ${Object.keys(graph.steps).join(', ')}. ` +
        `The step-name contract is free-form so a quest.json naming a retired step still loads; ` +
        `dispatch is the only place it may fail.`,
    });
  }

  const stepItems = scopeItems.filter(
    (item) => item.step !== undefined && String(item.step) === step,
  );
  const terminalStepItems = stepItems.filter((item) =>
    isTerminalWorkItemStatusGuard({ status: item.status }),
  );

  // A unit some LIVE work item holds is being worked right now — both siege walkers are assigned the
  // full scope, so without this each reads the other's units as abandoned and mints a fixer for them.
  const liveAssignedUnitIds = new Set(
    quest.workItems
      .filter((item) => !isTerminalWorkItemStatusGuard({ status: item.status }))
      .flatMap((item) => item.assignedUnitIds.map(String)),
  );

  // --- QUESTION 1: did this step REQUEST another step?
  if (request !== undefined) {
    const requestedNode = graph.steps[request.step];

    if (requestedNode === undefined) {
      return nextActionContract.parse({
        kind: 'block',
        operationItemId,
        family,
        step: request.step,
        reason: 'unknown-step',
        message:
          `step \`${request.step}\` is not declared in family \`${family}\` — ` +
          `agentFlowStatics.${family}.steps holds: ${Object.keys(graph.steps).join(', ')}. ` +
          `The step-name contract is free-form so a quest.json naming a retired step still loads; ` +
          `dispatch is the only place it may fail.`,
      });
    }

    return mintNextActionTransformer({
      quest,
      operationItemId,
      family,
      step: request.step,
      batch: [
        mintedWorkItemContract.parse({
          step: request.step,
          role: operationItem.role,
          assignedUnitIds: [],
          payload: { reason: request.reason },
          mintedBy: request.fromWorkItemId,
          needsLane: requestedNode.needsLane === true,
        }),
      ],
      cause: 'request',
      requiresProgress: requestedNode.requiresProgress === true,
      headSha,
      maxConcurrent: requestedNode.maxConcurrent,
    });
  }

  // --- QUESTION 2: does this step have `unmet` units?
  const unmetUnitIds = [
    ...new Set(terminalStepItems.flatMap((item) => item.assignedUnitIds.map(String))),
  ]
    .filter((unitId) => !liveAssignedUnitIds.has(unitId))
    .map((unitId) => qaChecklistItemContract.shape.id.parse(unitId))
    .filter((unitId) => {
      const mark = unitCurrentMarkTransformer({ quest, unitId });

      return mark === null || mark.mark === 'unmet';
    });

  const unmetTarget = node.routes.unmet;
  const unmetNode = unmetTarget === undefined ? undefined : graph.steps[unmetTarget];

  // A successor is never handed a unit its own step cannot settle. Units outside the target step's
  // scope — a `repair` holding off-map probes from before `repair` was declared `none` — fall through
  // to question 4, where the step's own outcome routes the scope without carrying them forward.
  const unmetTargetScope = new Set(
    unmetTarget === undefined
      ? []
      : stepInScopeUnitsTransformer({ quest, operationItemId, step: unmetTarget }).map(String),
  );
  const settleableUnmetUnitIds = unmetUnitIds.filter((unitId) =>
    unmetTargetScope.has(String(unitId)),
  );

  if (settleableUnmetUnitIds.length > 0 && unmetTarget !== undefined && unmetNode !== undefined) {
    return mintNextActionTransformer({
      quest,
      operationItemId,
      family,
      step: unmetTarget,
      batch: unmetBatchLayerTransformer({
        plan,
        unmetUnitIds: settleableUnmetUnitIds,
        terminalStepItems,
        step,
        unmetTarget,
        itemRole: operationItem.role,
        needsLane: unmetNode.needsLane === true,
      }),
      cause: 'unmet',
      requiresProgress: unmetNode.requiresProgress === true,
      headSha,
      maxConcurrent: unmetNode.maxConcurrent,
    });
  }

  // --- QUESTION 3: are there unstarted plan batches left AT THE CURRENT STEP?
  const startedPieceIds = new Set(
    quest.workItems.flatMap((item) => (item.pieceId === undefined ? [] : [item.pieceId])),
  );
  const hasUnstartedHere = (plan?.batches ?? []).some((planBatch) =>
    planBatch.pieces.some((piece) => String(piece.step) === step && !startedPieceIds.has(piece.id)),
  );

  // A step nothing has entered yet has no outcome to fold — it has to RUN before question 4 can ask
  // anything of it.
  if (hasUnstartedHere || stepItems.length === 0) {
    return mintNextActionTransformer({
      quest,
      operationItemId,
      family,
      step,
      batch: stepEntryBatchTransformer({
        quest,
        plan,
        operationItemId,
        step,
        itemRole: operationItem.role,
        stepRole: node.role,
        deterministic: node.kind === 'deterministic',
        needsLane: node.needsLane === true,
      }),
      cause: 'plan-batch',
      requiresProgress: node.requiresProgress === true,
      headSha,
      maxConcurrent: node.maxConcurrent,
    });
  }

  // THE PHASE RULE. A pending or in_progress item at this step means the step has not drained, so
  // question 4 is not reached and the honest answer is "come back".
  if (stepItems.length > terminalStepItems.length) {
    return nextActionContract.parse({
      kind: 'mint',
      operationItemId,
      step,
      cause: 'capped',
      batch: [],
    });
  }

  // --- QUESTION 4: otherwise, follow the step's own route for the outcome it folded to.
  const outcome =
    hitWall === true
      ? 'wall'
      : foldOutcomesTransformer({
          outcomes: terminalStepItems.map((item) =>
            item.assignedUnitIds.length === 0
              ? deriveOutcomeTransformer({
                  assignedUnitIds: [],
                  observations: item.observations,
                  declaredWord:
                    declaredWord ??
                    (node.role === 'planner' && (plan === null || plan.batches.length === 0)
                      ? 'empty'
                      : 'done'),
                  hitWall: false,
                })
              : deriveOutcomeTransformer({
                  assignedUnitIds: item.assignedUnitIds,
                  observations: item.observations,
                  hitWall: false,
                }),
          ),
        });

  const target = node.routes[outcome];

  if (target === undefined) {
    const returning = terminalStepItems.at(-1);
    const minterId = returning?.mintedBy;
    const minter =
      minterId === undefined
        ? undefined
        : quest.workItems.find((item) => String(item.id) === String(minterId));

    if (minter?.step === undefined) {
      return nextActionContract.parse({
        kind: 'block',
        operationItemId,
        family,
        step,
        reason: 'no-minter',
        message:
          `step \`${step}\` in family \`${family}\` folded to \`${outcome}\`, ` +
          `which it declares no route for, and the work item that recorded it names no minter to ` +
          `return to. An undeclared outcome returns to whoever minted the step; with neither a ` +
          `route nor a minter the scope has nowhere to go.`,
      });
    }

    const minterStep = String(minter.step);
    const minterNode = graph.steps[minterStep];

    if (minterNode === undefined) {
      return nextActionContract.parse({
        kind: 'block',
        operationItemId,
        family,
        step: minterStep,
        reason: 'unknown-step',
        message:
          `step \`${minterStep}\` is not declared in family \`${family}\` — ` +
          `agentFlowStatics.${family}.steps holds: ${Object.keys(graph.steps).join(', ')}. ` +
          `The step-name contract is free-form so a quest.json naming a retired step still loads; ` +
          `dispatch is the only place it may fail.`,
      });
    }

    // A return mints a FRESH work item at the minter's step — it does not resume the minter's own.
    // A worker carries its minter's units minus whatever is now settled, plus its piece and brief,
    // so the recipe it asked for lands on the same work it was already doing.
    if (minterNode.role === 'worker' && minterNode.kind !== 'deterministic') {
      return mintNextActionTransformer({
        quest,
        operationItemId,
        family,
        step: minterStep,
        batch: [
          mintedWorkItemContract.parse({
            step: minterStep,
            role: operationItem.role,
            assignedUnitIds: minter.assignedUnitIds.filter((unitId) => {
              const mark = unitCurrentMarkTransformer({ quest, unitId });

              return mark === null || mark.mark === 'unmet';
            }),
            needsLane: minterNode.needsLane === true,
            ...(minter.pieceId === undefined ? {} : { pieceId: minter.pieceId }),
            ...(minter.payload === undefined ? {} : { payload: minter.payload }),
            ...(minter.mintedBy === undefined ? {} : { mintedBy: minter.mintedBy }),
          }),
        ],
        cause: 'return-to-minter',
        requiresProgress: minterNode.requiresProgress === true,
        headSha,
        maxConcurrent: minterNode.maxConcurrent,
      });
    }

    return mintNextActionTransformer({
      quest,
      operationItemId,
      family,
      step: minterStep,
      batch: stepEntryBatchTransformer({
        quest,
        plan,
        operationItemId,
        step: minterStep,
        itemRole: operationItem.role,
        stepRole: minterNode.role,
        deterministic: minterNode.kind === 'deterministic',
        needsLane: minterNode.needsLane === true,
      }),
      cause: 'return-to-minter',
      requiresProgress: minterNode.requiresProgress === true,
      headSha,
      maxConcurrent: minterNode.maxConcurrent,
    });
  }

  if (target === '@done') {
    return nextActionContract.parse({ kind: 'complete', operationItemId, outcome });
  }

  if (target === '@blocked') {
    return nextActionContract.parse({
      kind: 'block',
      operationItemId,
      family,
      step,
      reason: 'wall',
      message:
        `step \`${step}\` in family \`${family}\` folded to \`${outcome}\` and ` +
        `routes it to \`@blocked\` for operation item ${String(operationItemId)}. No fresh session ` +
        `of any role passes this, so the quest halts here for a human.`,
    });
  }

  const targetNode = graph.steps[target];

  if (targetNode === undefined) {
    return nextActionContract.parse({
      kind: 'block',
      operationItemId,
      family,
      step,
      reason: 'unknown-route-target',
      message:
        `step \`${step}\` in family \`${family}\` routes \`${outcome}\` to ` +
        `\`${target}\`, which is neither a step in that family nor \`@done\` nor \`@blocked\`. ` +
        `The graph reachability check runs at lint and at load; this throw is its backstop.`,
    });
  }

  const routeTarget = target;
  const routeBatch = stepEntryBatchTransformer({
    quest,
    plan,
    operationItemId,
    step: routeTarget,
    itemRole: operationItem.role,
    stepRole: targetNode.role,
    deterministic: targetNode.kind === 'deterministic',
    needsLane: targetNode.needsLane === true,
  });

  // The target declares no `done` route of its own (`repair`, `fixHappy`, `fixAdversarial`) — it is
  // designed to be return-only, so THIS mint has to carry the return edge's fuel because no mark-mint
  // ever will. `routeGateId` is the same "current item at this step" fallback question 2's mark-mint
  // already uses; a target that DOES declare `done` (`review`, `work`, riftcarver's and wardFull's own
  // `repair`) is left untouched, so a genuine gap in ITS OWN route table still surfaces as
  // `no-minter` instead of a silent, unintended return. A route back to the SAME step (`repair`'s
  // own `unmet`) passes the current item's minter through, for the reason `unmetBatchLayerTransformer`
  // gives: naming the current repair would return the next one to another repair, not to the gate.
  const routeGate = terminalStepItems.at(-1);
  const routeGateId = routeTarget === step ? (routeGate?.mintedBy ?? routeGate?.id) : routeGate?.id;
  const batch =
    targetNode.routes.done === undefined && routeGateId !== undefined
      ? routeBatch.map((item) => mintedWorkItemContract.parse({ ...item, mintedBy: routeGateId }))
      : routeBatch;

  return mintNextActionTransformer({
    quest,
    operationItemId,
    family,
    step: routeTarget,
    batch,
    cause: 'plan-batch',
    requiresProgress: targetNode.requiresProgress === true,
    headSha,
    maxConcurrent: targetNode.maxConcurrent,
    from: step,
    outcome,
  });
};
