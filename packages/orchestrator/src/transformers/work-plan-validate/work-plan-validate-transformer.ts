/**
 * PURPOSE: Every reason a submitted plan must be refused, whole — a plan is a graph of references
 * into `quest.json` and into the step config, and every one of them can be wrong. Parses the raw
 * submission through `workPlanContract` first (which is where checks 11 and half of 17 are already
 * refused, by that contract's own `.superRefine()` — see its header), then cross-references the
 * remaining checks against the quest and the submitting work item.
 *
 * USAGE:
 * workPlanValidateTransformer({ quest, workItem, plan: submittedPlanJson });
 * // Returns WorkPlanValidationFailure[] — empty means the plan is accepted. A non-empty list means
 * // NOTHING was written; the caller (story 17) joins the list into one message and refuses the
 * // whole plan, never a piece.
 *
 * `check` numbers throughout are named in `workPlanValidationCheckStatics.numbers`, per
 * `scrolls/orcha-changes/08-plan-validation.md`'s own table. Checks 1, 7, 8 and 17 sit on the plan
 * ENVELOPE (`operationItemId`, `flowId`, `packageNames`, `plannerMarks`) rather than on any one
 * piece, so a failure there is a failure of the WHOLE plan — it is attached to every piece the plan
 * carries, the same "reject the whole plan" reasoning that governs the return value as a whole.
 * Check 19 ("a walk piece whose path needs a seeded system names a recipe") is OPEN: nothing in
 * this repo can answer whether a given path needs a seeded system, so it is named in
 * `workPlanValidationCheckStatics` as not-yet-checkable, never silently dropped from the list.
 */

import { operationItemIdContract } from '@dungeonmaster/shared/contracts';
import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { workPlanContract } from '../../contracts/work-plan/work-plan-contract';
import { workPlanPayloadCodeweaverContract } from '../../contracts/work-plan-payload-codeweaver/work-plan-payload-codeweaver-contract';
import { workPlanPayloadFlowriderContract } from '../../contracts/work-plan-payload-flowrider/work-plan-payload-flowrider-contract';
import { workPlanPayloadSiegemasterContract } from '../../contracts/work-plan-payload-siegemaster/work-plan-payload-siegemaster-contract';
import { workPlanValidationCheckContract } from '../../contracts/work-plan-validation-check/work-plan-validation-check-contract';
import { workPlanValidationFailureContract } from '../../contracts/work-plan-validation-failure/work-plan-validation-failure-contract';
import type { WorkPlanValidationFailure } from '../../contracts/work-plan-validation-failure/work-plan-validation-failure-contract';
import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';
import { workPlanValidationCheckStatics } from '../../statics/work-plan-validation-check/work-plan-validation-check-statics';
import { operationSignoffScopeTransformer } from '../operation-signoff-scope/operation-signoff-scope-transformer';
import { qaChecklistBuildTransformer } from '../qa-checklist-build/qa-checklist-build-transformer';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';
import { workPlanQuestUnitIdsTransformer } from '../work-plan-quest-unit-ids/work-plan-quest-unit-ids-transformer';

const OPERATIONS_REF_PREFIX = 'operations/';

export const workPlanValidateTransformer = ({
  quest,
  workItem,
  plan,
}: {
  quest: Quest;
  workItem: WorkItem;
  plan: unknown;
}): WorkPlanValidationFailure[] => {
  const parsedPlan = workPlanContract.parse(plan);
  const { numbers } = workPlanValidationCheckStatics;

  const failures: WorkPlanValidationFailure[] = [];

  const allPieces = parsedPlan.batches.flatMap((batch, batchIndex) =>
    batch.pieces.map((piece) => ({ piece, batchIndex })),
  );

  const batchIndexByPieceId = new Map(
    parsedPlan.batches.flatMap((batch, batchIndex) =>
      batch.pieces.map((piece) => [piece.id, batchIndex] as const),
    ),
  );

  const operationRef = workItem.relatedDataItems.find((ref) =>
    ref.startsWith(OPERATIONS_REF_PREFIX),
  );
  const workItemOperationItemId =
    operationRef === undefined
      ? undefined
      : operationItemIdContract.parse(operationRef.slice(OPERATIONS_REF_PREFIX.length));

  // Check 1: operationItemId matches the submitting work item's own operations/<id> ref.
  if (
    workItemOperationItemId === undefined ||
    String(parsedPlan.operationItemId) !== String(workItemOperationItemId)
  ) {
    allPieces.forEach(({ piece }) => {
      failures.push(
        workPlanValidationFailureContract.parse({
          pieceId: piece.id,
          check: workPlanValidationCheckContract.parse(numbers.operationItemMismatch),
          message: `operationItemId '${String(parsedPlan.operationItemId)}' does not match this work item's own operation item '${
            workItemOperationItemId === undefined ? '(none)' : String(workItemOperationItemId)
          }'`,
        }),
      );
    });
  }

  // Check 2: every piece.id is unique within the file.
  allPieces.forEach(({ piece }) => {
    const sharers = allPieces.filter(
      (candidate) => String(candidate.piece.id) === String(piece.id),
    );
    if (sharers.length > 1) {
      failures.push(
        workPlanValidationFailureContract.parse({
          pieceId: piece.id,
          check: workPlanValidationCheckContract.parse(numbers.duplicatePieceId),
          message: `piece id '${String(piece.id)}' is used by two pieces in this plan — piece ids must be unique within the file`,
        }),
      );
    }
  });

  // Check 3: every piece.step exists in THIS family's step graph.
  const stepNames = new Set(Object.keys(agentFlowStatics[parsedPlan.family].steps));
  allPieces.forEach(({ piece }) => {
    if (!stepNames.has(String(piece.step))) {
      failures.push(
        workPlanValidationFailureContract.parse({
          pieceId: piece.id,
          check: workPlanValidationCheckContract.parse(numbers.unknownStep),
          message: `${String(piece.id)}: step '${String(piece.step)}' does not exist in the ${parsedPlan.family} step graph`,
        }),
      );
    }
  });

  // Check 4: every assignedUnitIds and contextUnitIds entry resolves to a real unit on the quest —
  // measured against the WHOLE quest, never one operation item's scope (that is check 5, below).
  const questUnitIds = new Set(
    workPlanQuestUnitIdsTransformer({ quest }).map((unitId) => String(unitId)),
  );
  allPieces.forEach(({ piece }) => {
    const claims = [
      ...piece.assignedUnitIds.map((unitId) => ({ unitId, field: 'assignedUnitIds' })),
      ...piece.contextUnitIds.map((unitId) => ({ unitId, field: 'contextUnitIds' })),
    ];
    claims.forEach(({ unitId, field }) => {
      if (!questUnitIds.has(String(unitId))) {
        failures.push(
          workPlanValidationFailureContract.parse({
            pieceId: piece.id,
            check: workPlanValidationCheckContract.parse(numbers.unresolvedUnit),
            message: `${String(piece.id)}: ${field} names '${String(unitId)}', which is not a unit on flow '${String(unitId).split(':')[0]}'`,
          }),
        );
      }
    });
  });

  // Check 5: every ASSIGNED unit is IN SCOPE for this operation item. Context units are exempt — a
  // context unit is by definition a unit from somewhere else. Family-level scope only; never
  // step-level, and never waits on the step-narrowing transformer stories 11/12 add later.
  const operationItem = quest.operations.find(
    (candidate) => String(candidate.id) === String(parsedPlan.operationItemId),
  );
  const scope =
    operationItem === undefined ? null : operationSignoffScopeTransformer({ quest, operationItem });
  const legalUnitIds = new Set(
    scope === null
      ? []
      : scope.flows.flatMap((scopeFlow) =>
          qaChecklistBuildTransformer({
            flow: scopeFlow,
            packagesAffected: quest.packagesAffected,
            packageNames: scope.packageNames,
            track: scope.track,
          }).items.map((item) => String(item.id)),
        ),
  );
  allPieces.forEach(({ piece }) => {
    piece.assignedUnitIds.forEach((unitId) => {
      if (!legalUnitIds.has(String(unitId))) {
        failures.push(
          workPlanValidationFailureContract.parse({
            pieceId: piece.id,
            check: workPlanValidationCheckContract.parse(numbers.outOfScopeAssignedUnit),
            message: `${String(piece.id)}: assigned unit '${String(unitId)}' is not in scope for operation item '${String(parsedPlan.operationItemId)}'`,
          }),
        );
      }
    });
  });

  // Check 6: no unit is claimed by two pieces in the same batch.
  parsedPlan.batches.forEach((batch) => {
    const claims = batch.pieces.flatMap((piece) =>
      piece.assignedUnitIds.map((unitId) => ({ piece, unitId })),
    );
    claims.forEach(({ piece, unitId }) => {
      const claimantPieces = claims
        .filter((claim) => String(claim.unitId) === String(unitId))
        .map((claim) => claim.piece);
      if (claimantPieces.length > 1) {
        const names = claimantPieces.map((claimant) => String(claimant.id)).join(' and ');
        failures.push(
          workPlanValidationFailureContract.parse({
            pieceId: piece.id,
            check: workPlanValidationCheckContract.parse(numbers.duplicateUnitClaim),
            message: `${names} both claim unit '${String(unitId)}' in the same batch`,
          }),
        );
      }
    });
  });

  // Check 7: the plan's flowId (if named) resolves in quest.flows[]. Also resolves the one Flow
  // object checks 12 and 18 read.
  const flow =
    parsedPlan.flowId === null
      ? undefined
      : quest.flows.find((candidate) => String(candidate.id) === String(parsedPlan.flowId));
  if (parsedPlan.flowId !== null && flow === undefined) {
    allPieces.forEach(({ piece }) => {
      failures.push(
        workPlanValidationFailureContract.parse({
          pieceId: piece.id,
          check: workPlanValidationCheckContract.parse(numbers.unknownFlow),
          message: `flowId '${String(parsedPlan.flowId)}' does not resolve in quest.flows[]`,
        }),
      );
    });
  }

  // Check 8: every packageName resolves in quest.packagesAffected[].
  const declaredPackageNames = new Set(quest.packagesAffected.map((entry) => String(entry.name)));
  parsedPlan.packageNames.forEach((packageName) => {
    if (!declaredPackageNames.has(String(packageName))) {
      allPieces.forEach(({ piece }) => {
        failures.push(
          workPlanValidationFailureContract.parse({
            pieceId: piece.id,
            check: workPlanValidationCheckContract.parse(numbers.unknownPackage),
            message: `packageName '${String(packageName)}' does not resolve in quest.packagesAffected[]`,
          }),
        );
      });
    }
  });

  // Check 9 (codeweaver only): every payload.files[].path sits under a package this scope owns.
  const ownedPackageLocations = quest.packagesAffected
    .filter((entry) => parsedPlan.packageNames.some((name) => String(name) === String(entry.name)))
    .map((entry) => String(entry.location).replace(/^\.\//u, '').replace(/\/$/u, ''));

  if (parsedPlan.family === 'codeweaver') {
    allPieces.forEach(({ piece }) => {
      const payload = workPlanPayloadCodeweaverContract.parse(piece.payload);
      payload.files.forEach((file) => {
        const normalizedFilePath = String(file.path).replace(/^\.\//u, '');
        const sitsUnderOwnedPackage = ownedPackageLocations.some((location) =>
          normalizedFilePath.startsWith(`${location}/`),
        );
        if (!sitsUnderOwnedPackage) {
          failures.push(
            workPlanValidationFailureContract.parse({
              pieceId: piece.id,
              check: workPlanValidationCheckContract.parse(numbers.fileOutsideOwnedPackage),
              message: `${String(piece.id)}: payload.files[].path '${String(file.path)}' is outside the packages this operation item owns (${parsedPlan.packageNames.map((name) => String(name)).join(', ')})`,
            }),
          );
        }
      });
    });
  }

  // Check 12 (flowrider only): every observableTarget resolves to the node or edge that unit
  // actually hangs on. An off-map unit hangs on no node or edge, so it has nothing to check here.
  // Check 13 (flowrider only, early warning): a browser-layer piece count per batch is within the
  // step's maxConcurrent — the router (story 15) is what enforces the cap for real.
  if (parsedPlan.family === 'flowrider') {
    allPieces.forEach(({ piece }) => {
      const payload = workPlanPayloadFlowriderContract.parse(piece.payload);
      if (flow === undefined) {
        return;
      }
      payload.units.forEach((unit) => {
        const realUnit = qaUnitEnumerateTransformer({ flow }).find(
          (candidate) => String(candidate.id) === String(unit.unitId),
        );
        if (realUnit === undefined) {
          return;
        }
        const { observableTarget } = unit;
        const resolvesCorrectly =
          realUnit.kind === 'off-map' ||
          (realUnit.kind === 'terminal' &&
            observableTarget.target === 'node' &&
            String(observableTarget.nodeId) === String(realUnit.nodeId)) ||
          (realUnit.kind === 'branch' &&
            observableTarget.target === 'edge' &&
            String(observableTarget.edgeId) === String(realUnit.edgeId)) ||
          (realUnit.kind === 'observable' &&
            observableTarget.target === 'observable' &&
            String(observableTarget.nodeId) === String(realUnit.nodeId));
        if (!resolvesCorrectly) {
          failures.push(
            workPlanValidationFailureContract.parse({
              pieceId: piece.id,
              check: workPlanValidationCheckContract.parse(numbers.observableTargetMismatch),
              message: `${String(piece.id)}: observableTarget for unit '${String(unit.unitId)}' does not resolve to the node or edge that unit actually hangs on`,
            }),
          );
        }
      });
    });

    const flowriderStepDefs = new Map(Object.entries(agentFlowStatics.flowrider.steps));
    parsedPlan.batches.forEach((batch, batchIndex) => {
      const distinctSteps = [...new Set(batch.pieces.map((piece) => String(piece.step)))];
      distinctSteps.forEach((stepValue) => {
        const stepDef = flowriderStepDefs.get(stepValue);
        const maxConcurrent =
          stepDef !== undefined && 'maxConcurrent' in stepDef ? stepDef.maxConcurrent : undefined;
        if (maxConcurrent === undefined) {
          return;
        }
        const browserPieces = batch.pieces.filter(
          (piece) =>
            String(piece.step) === stepValue &&
            workPlanPayloadFlowriderContract
              .parse(piece.payload)
              .units.some((unit) => unit.layer === 'browser'),
        );
        if (browserPieces.length > maxConcurrent.limit) {
          browserPieces.forEach((piece) => {
            failures.push(
              workPlanValidationFailureContract.parse({
                pieceId: piece.id,
                check: workPlanValidationCheckContract.parse(numbers.batchConcurrency),
                message: `batch ${batchIndex + 1} names ${browserPieces.length} browser-layer pieces at step '${stepValue}', over the maxConcurrent limit of ${maxConcurrent.limit}`,
              }),
            );
          });
        }
      });
    });
  }

  // Check 16 (siegemaster only, second half — an invalid enum value is refused earlier, at
  // workPlanContract's own parse step: workPlanPayloadSiegemasterContract's offMapFamily is
  // already qaOffMapFamilyContract, the same mechanism as checks 11 and 17's first half): no
  // family is allocated twice.
  if (parsedPlan.family === 'siegemaster') {
    allPieces.forEach(({ piece }) => {
      const payload = workPlanPayloadSiegemasterContract.parse(piece.payload);
      if (payload.offMapFamily === null) {
        return;
      }
      const sharers = allPieces.filter(({ piece: candidate }) => {
        if (String(candidate.id) === String(piece.id)) {
          return false;
        }
        const candidatePayload = workPlanPayloadSiegemasterContract.parse(candidate.payload);
        return candidatePayload.offMapFamily === payload.offMapFamily;
      });
      if (sharers.length > 0) {
        const names = [piece, ...sharers.map((sharer) => sharer.piece)]
          .map((claimant) => String(claimant.id))
          .join(', ');
        failures.push(
          workPlanValidationFailureContract.parse({
            pieceId: piece.id,
            check: workPlanValidationCheckContract.parse(numbers.duplicateOffMapFamily),
            message: `offMapFamily '${payload.offMapFamily}' is allocated to more than one piece in this plan (${names})`,
          }),
        );
      }
    });
  }

  // Check 10: no two pieces in one batch name the same file path.
  const pieceFilePaths = allPieces.map(({ piece, batchIndex }) => {
    if (parsedPlan.family === 'codeweaver') {
      return {
        piece,
        batchIndex,
        paths: workPlanPayloadCodeweaverContract
          .parse(piece.payload)
          .files.map((file) => file.path),
      };
    }
    if (parsedPlan.family === 'flowrider') {
      const payload = workPlanPayloadFlowriderContract.parse(piece.payload);
      return {
        piece,
        batchIndex,
        paths: [payload.specPath, ...payload.harnesses.map((harness) => harness.path)],
      };
    }
    return { piece, batchIndex, paths: [] };
  });

  const pathClaims = pieceFilePaths.flatMap(({ piece, batchIndex, paths }) =>
    paths.map((path) => ({ piece, batchIndex, path: String(path) })),
  );
  const uniqueBatchPathKeys = [
    ...new Set(pathClaims.map((claim) => `${claim.batchIndex}\u0000${claim.path}`)),
  ];
  uniqueBatchPathKeys.forEach((key) => {
    const claimants = pathClaims.filter(
      (claim) => `${claim.batchIndex}\u0000${claim.path}` === key,
    );
    const uniqueClaimantPieces = [
      ...new Map(claimants.map((claim) => [String(claim.piece.id), claim.piece])).values(),
    ];
    if (uniqueClaimantPieces.length > 1) {
      const path = claimants[0]?.path ?? '';
      const names = uniqueClaimantPieces.map((claimant) => String(claimant.id)).join(' and ');
      uniqueClaimantPieces.forEach((piece) => {
        failures.push(
          workPlanValidationFailureContract.parse({
            pieceId: piece.id,
            check: workPlanValidationCheckContract.parse(numbers.duplicateFilePath),
            message: `${names} both name file path '${path}' in the same batch`,
          }),
        );
      });
    }
  });

  // Check 14: every piece in one batch names the SAME step.
  parsedPlan.batches.forEach((batch, batchIndex) => {
    const stepValues = new Set(batch.pieces.map((piece) => String(piece.step)));
    if (stepValues.size > 1) {
      const stepsList = [...stepValues].map((stepValue) => `'${stepValue}'`).join(' and ');
      batch.pieces.forEach((piece) => {
        failures.push(
          workPlanValidationFailureContract.parse({
            pieceId: piece.id,
            check: workPlanValidationCheckContract.parse(numbers.batchMixedSteps),
            message: `batch ${batchIndex + 1} mixes steps ${stepsList} — every piece in one batch must name the same step`,
          }),
        );
      });
    }
  });

  // Check 15: every adversarial piece names a baselineFor resolving to a happyWalk piece in an
  // EARLIER batch.
  allPieces.forEach(({ piece, batchIndex }) => {
    if (piece.baselineFor === undefined) {
      return;
    }
    const baselineBatchIndex = batchIndexByPieceId.get(piece.baselineFor);
    if (baselineBatchIndex === undefined) {
      failures.push(
        workPlanValidationFailureContract.parse({
          pieceId: piece.id,
          check: workPlanValidationCheckContract.parse(numbers.adversarialBaseline),
          message: `${String(piece.id)}: baselineFor '${String(piece.baselineFor)}' does not resolve to any piece in this plan`,
        }),
      );
      return;
    }
    if (baselineBatchIndex >= batchIndex) {
      failures.push(
        workPlanValidationFailureContract.parse({
          pieceId: piece.id,
          check: workPlanValidationCheckContract.parse(numbers.adversarialBaseline),
          message: `${String(piece.id)}: baselineFor '${String(piece.baselineFor)}' resolves to a piece in ${
            baselineBatchIndex === batchIndex ? 'the SAME' : 'a LATER'
          } batch, not an earlier one`,
        }),
      );
    }
  });

  // Check 17 (second half — cant-meet-with-toSettle and no-double-claim are refused earlier, at
  // workPlanContract's own parse step): the unit a plannerMarks entry names is a REAL unit on the
  // quest, the same derivation as check 4. A mark sits on the plan envelope, not on any piece, so a
  // failure here attaches to every piece, the same as checks 1, 7 and 8.
  parsedPlan.plannerMarks.forEach((mark, markIndex) => {
    if (!questUnitIds.has(String(mark.unitId))) {
      allPieces.forEach(({ piece }) => {
        failures.push(
          workPlanValidationFailureContract.parse({
            pieceId: piece.id,
            check: workPlanValidationCheckContract.parse(numbers.plannerMarkUnresolvedUnit),
            message: `plannerMarks[${markIndex}]: unit '${String(mark.unitId)}' is not a unit on this quest`,
          }),
        );
      });
    }
  });

  // Check 18: every recipeId a piece names is recorded on that flow AND carries the run id that
  // proved it. `flowRecipeContract.runId` is required, not optional, so a recorded entry with no
  // proof cannot exist on a parsed quest — "recorded" and "carries a runId" collapse into the one
  // existence test below.
  allPieces.forEach(({ piece }) => {
    if (piece.recipeId === undefined) {
      return;
    }
    const recipeEntry = flow?.recipes.find(
      (candidate) => String(candidate.id) === String(piece.recipeId),
    );
    if (recipeEntry === undefined) {
      failures.push(
        workPlanValidationFailureContract.parse({
          pieceId: piece.id,
          check: workPlanValidationCheckContract.parse(numbers.recipeNotRecorded),
          message: `${String(piece.id)}: recipeId '${String(piece.recipeId)}' is not recorded on flow '${
            flow === undefined ? String(parsedPlan.flowId) : String(flow.id)
          }'`,
        }),
      );
    }
  });

  // Check 19 ("a walk piece whose path needs a seeded system names a recipe") is OPEN. Nothing in
  // this repo can answer whether a given path "needs a seeded system" — inventing that predicate
  // would be inventing a design decision this story does not own. Left named in
  // `workPlanValidationCheckStatics` as not-yet-checkable rather than silently dropped.

  return failures;
};
