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
 * THIS FILE TAKES NO LOCK, EVER. `questWithModifyLockBroker` is deliberately non-reentrant and
 * wrapping a write in it deadlocks that questId, so the router is pure and synchronous and its caller
 * reads the plan BEFORE it enters the lock — which is also why `plan` arrives as an argument rather
 * than being read here.
 *
 * `request`, `invalidatedFlowIds`, `declaredWord` AND `hitWall` ARRIVE AS ARGUMENTS for the same
 * reason `deriveOutcomeTransformer` takes `declaredWord` and `hitWall`: the work tool writes them and
 * this reads them, and a pure function cannot go and look. `request` carries its own asker, because
 * the minted step's `done` returns to the session that asked for it.
 */

import type {
  FlowId,
  OperationItemId,
  Quest,
  QuestWorkItemId,
  StepName,
  UnitId,
} from '@dungeonmaster/shared/contracts';
import { stepNameContract, unitIdContract } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { mintedWorkItemContract } from '../../contracts/minted-work-item/minted-work-item-contract';
import { nextActionContract } from '../../contracts/next-action/next-action-contract';
import type { NextAction } from '../../contracts/next-action/next-action-contract';
import { stepOutcomeContract } from '../../contracts/step-outcome/step-outcome-contract';
import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';
import type { WorkPlan } from '../../contracts/work-plan/work-plan-contract';
import type { WorkPlanPiece } from '../../contracts/work-plan-piece/work-plan-piece-contract';
import { deriveOutcomeTransformer } from '../derive-outcome/derive-outcome-transformer';
import { foldOutcomesTransformer } from '../fold-outcomes/fold-outcomes-transformer';
import { mintNextActionTransformer } from '../mint-next-action/mint-next-action-transformer';
import { pieceBriefPayloadTransformer } from '../piece-brief-payload/piece-brief-payload-transformer';
import { stepEntryBatchTransformer } from '../step-entry-batch/step-entry-batch-transformer';
import { stepInScopeUnitsTransformer } from '../step-in-scope-units/step-in-scope-units-transformer';
import { unitCurrentMarkTransformer } from '../unit-current-mark/unit-current-mark-transformer';

export const nextActionTransformer = ({
  quest,
  plan,
  operationItemId,
  agentFlowStatics,
  questFlowStatics,
  request,
  invalidatedFlowIds,
  declaredWord,
  hitWall,
}: {
  quest: Quest;
  plan: WorkPlan | null;
  operationItemId: OperationItemId;
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
                  maxVisits: number;
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
  request?: { fromWorkItemId: QuestWorkItemId; step: StepName; reason: string };
  invalidatedFlowIds?: readonly FlowId[];
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
  const step = stepNameContract.parse(lastStepped?.step ?? graph.entry);
  const node = graph.steps[String(step)];

  if (node === undefined) {
    return nextActionContract.parse({
      kind: 'block',
      operationItemId,
      family,
      step,
      reason: 'unknown-step',
      message:
        `step \`${String(step)}\` is not declared in family \`${family}\` — ` +
        `agentFlowStatics.${family}.steps holds: ${Object.keys(graph.steps).join(', ')}. ` +
        `The step-name contract is free-form so a quest.json naming a retired step still loads; ` +
        `dispatch is the only place it may fail.`,
    });
  }

  const stepItems = scopeItems.filter(
    (item) => item.step !== undefined && String(item.step) === String(step),
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

  const invalidatedUnitIds =
    invalidatedFlowIds === undefined || invalidatedFlowIds.length === 0
      ? []
      : stepInScopeUnitsTransformer({ quest, operationItemId, step }).filter((unitId) =>
          invalidatedFlowIds.some((flowId) => String(unitId).startsWith(`${String(flowId)}:`)),
        );

  // --- QUESTION 1: did this step REQUEST another step?
  if (request !== undefined) {
    const requestedNode = graph.steps[String(request.step)];

    if (requestedNode === undefined) {
      return nextActionContract.parse({
        kind: 'block',
        operationItemId,
        family,
        step: request.step,
        reason: 'unknown-step',
        message:
          `step \`${String(request.step)}\` is not declared in family \`${family}\` — ` +
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
      maxVisits: requestedNode.maxVisits,
      maxConcurrent: requestedNode.maxConcurrent,
      // A requested step measures nothing, so re-opened units never land on it — they wait for the
      // route target, or for the minter this returns to.
      invalidatedUnitIds: [],
    });
  }

  // --- QUESTION 2: does this step have `unmet` units?
  const unmetUnitIds = [
    ...new Set(terminalStepItems.flatMap((item) => item.assignedUnitIds.map(String))),
  ]
    .filter((unitId) => !liveAssignedUnitIds.has(unitId))
    .map((unitId) => unitIdContract.parse(unitId))
    .filter((unitId) => {
      const mark = unitCurrentMarkTransformer({ quest, unitId });

      return mark === null || mark.mark === 'unmet';
    });

  const unmetTarget = node.routes.unmet;
  const unmetNode = unmetTarget === undefined ? undefined : graph.steps[unmetTarget];

  if (unmetUnitIds.length > 0 && unmetTarget !== undefined && unmetNode !== undefined) {
    const claimedBy = new Map<UnitId, WorkPlanPiece>();

    for (const planBatch of plan?.batches ?? []) {
      for (const piece of planBatch.pieces) {
        for (const claimed of piece.assignedUnitIds) {
          if (!claimedBy.has(claimed)) {
            claimedBy.set(claimed, piece);
          }
        }
      }
    }

    const claimedGroups = (plan?.batches ?? [])
      .flatMap((planBatch) => planBatch.pieces)
      .map((piece) => ({
        piece,
        unitIds: unmetUnitIds.filter((unitId) => claimedBy.get(unitId) === piece),
      }))
      .filter((group) => group.unitIds.length > 0);

    const unclaimedUnitIds = unmetUnitIds.filter((unitId) => !claimedBy.has(unitId));
    const fallbackMinter = terminalStepItems.at(-1);

    return mintNextActionTransformer({
      quest,
      operationItemId,
      family,
      step: stepNameContract.parse(unmetTarget),
      batch: [
        ...claimedGroups.map((group) => {
          const payload = pieceBriefPayloadTransformer({
            piece: group.piece,
            unitIds: group.unitIds,
          });
          const minter =
            [...terminalStepItems]
              .reverse()
              .find((item) =>
                item.assignedUnitIds.some((held) =>
                  group.unitIds.some((unitId) => String(unitId) === String(held)),
                ),
              ) ?? fallbackMinter;

          return mintedWorkItemContract.parse({
            step: unmetTarget,
            role: operationItem.role,
            assignedUnitIds: group.unitIds,
            needsLane: unmetNode.needsLane === true,
            ...(payload === undefined ? {} : { payload }),
            ...(minter === undefined ? {} : { mintedBy: minter.id }),
          });
        }),
        ...unclaimedUnitIds.map((unitId) => {
          const minter =
            [...terminalStepItems]
              .reverse()
              .find((item) =>
                item.assignedUnitIds.some((held) => String(held) === String(unitId)),
              ) ?? fallbackMinter;

          return mintedWorkItemContract.parse({
            step: unmetTarget,
            role: operationItem.role,
            assignedUnitIds: [unitId],
            needsLane: unmetNode.needsLane === true,
            ...(minter === undefined ? {} : { mintedBy: minter.id }),
          });
        }),
      ],
      cause: 'unmet',
      maxVisits: unmetNode.maxVisits,
      maxConcurrent: unmetNode.maxConcurrent,
      invalidatedUnitIds,
    });
  }

  // --- QUESTION 3: are there unstarted plan batches left AT THE CURRENT STEP?
  const startedPieceIds = new Set(
    quest.workItems.flatMap((item) => (item.pieceId === undefined ? [] : [String(item.pieceId)])),
  );
  const hasUnstartedHere = (plan?.batches ?? []).some((planBatch) =>
    planBatch.pieces.some(
      (piece) => String(piece.step) === String(step) && !startedPieceIds.has(String(piece.id)),
    ),
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
      maxVisits: node.maxVisits,
      maxConcurrent: node.maxConcurrent,
      invalidatedUnitIds,
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
      ? stepOutcomeContract.parse('wall')
      : foldOutcomesTransformer({
          outcomes: terminalStepItems.map((item) =>
            item.assignedUnitIds.length === 0
              ? deriveOutcomeTransformer({
                  assignedUnitIds: [],
                  observations: item.observations,
                  declaredWord:
                    declaredWord ??
                    stepOutcomeContract.parse(
                      node.role === 'planner' && (plan === null || plan.batches.length === 0)
                        ? 'empty'
                        : 'done',
                    ),
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
          `step \`${String(step)}\` in family \`${family}\` folded to \`${outcome}\`, ` +
          `which it declares no route for, and the work item that recorded it names no minter to ` +
          `return to. An undeclared outcome returns to whoever minted the step; with neither a ` +
          `route nor a minter the scope has nowhere to go.`,
      });
    }

    const minterStep = stepNameContract.parse(String(minter.step));
    const minterNode = graph.steps[String(minterStep)];

    if (minterNode === undefined) {
      return nextActionContract.parse({
        kind: 'block',
        operationItemId,
        family,
        step: minterStep,
        reason: 'unknown-step',
        message:
          `step \`${String(minterStep)}\` is not declared in family \`${family}\` — ` +
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
        maxVisits: minterNode.maxVisits,
        maxConcurrent: minterNode.maxConcurrent,
        invalidatedUnitIds,
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
      maxVisits: minterNode.maxVisits,
      maxConcurrent: minterNode.maxConcurrent,
      invalidatedUnitIds,
    });
  }

  if (target === '@done') {
    // The one lever that re-opens off-map families after a fix: a scope that would otherwise be
    // finished mints one more pass over exactly the re-opened units.
    if (invalidatedUnitIds.length > 0) {
      return mintNextActionTransformer({
        quest,
        operationItemId,
        family,
        step,
        batch: [
          mintedWorkItemContract.parse({
            step,
            role: operationItem.role,
            assignedUnitIds: [],
            needsLane: node.needsLane === true,
          }),
        ],
        cause: 'invalidation',
        maxVisits: node.maxVisits,
        maxConcurrent: node.maxConcurrent,
        invalidatedUnitIds,
      });
    }

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
        `step \`${String(step)}\` in family \`${family}\` folded to \`${outcome}\` and ` +
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
        `step \`${String(step)}\` in family \`${family}\` routes \`${outcome}\` to ` +
        `\`${target}\`, which is neither a step in that family nor \`@done\` nor \`@blocked\`. ` +
        `The graph reachability check runs at lint and at load; this throw is its backstop.`,
    });
  }

  const routeTarget = stepNameContract.parse(target);

  return mintNextActionTransformer({
    quest,
    operationItemId,
    family,
    step: routeTarget,
    batch: stepEntryBatchTransformer({
      quest,
      plan,
      operationItemId,
      step: routeTarget,
      itemRole: operationItem.role,
      stepRole: targetNode.role,
      deterministic: targetNode.kind === 'deterministic',
      needsLane: targetNode.needsLane === true,
    }),
    cause: 'plan-batch',
    maxVisits: targetNode.maxVisits,
    maxConcurrent: targetNode.maxConcurrent,
    invalidatedUnitIds,
    from: step,
    outcome,
  });
};
