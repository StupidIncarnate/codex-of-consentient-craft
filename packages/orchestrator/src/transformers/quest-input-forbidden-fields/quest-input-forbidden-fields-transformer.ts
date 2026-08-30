/**
 * PURPOSE: Returns descriptions of every forbidden field a modify-quest input attempts to write for the given current/next status
 *
 * USAGE:
 * questInputForbiddenFieldsTransformer({input, currentQuest, currentStatus: 'in_progress', nextStatus: undefined});
 * // Returns ErrorMessage[] of forbidden top-level fields and forbidden nested flow mutations.
 * // Empty array means the input passes the per-status allowlist gate.
 *
 * Behavior:
 * - Top-level fields not in allowlist (and not in backTransitionFields when nextStatus matches the carveout) are rejected.
 * - planningNotes acceptance: a `planningNotes` payload is accepted when either (a) `planningNotes` is in
 *   `allowedFields` or (b) the status's `allowedPlanningNotesFields` is `'all'` (only `in_progress`, where
 *   operators write operationPlans and reviewers write blightLedger). Otherwise the whole
 *   field is rejected with the blunt `Field 'planningNotes' not allowed`.
 * - planningNotes sub-field allowlist: enforced ONLY for statuses that accept planningNotes via (a) and carry
 *   a finite `allowedPlanningNotesFields` array. Every sub-field present must appear in that array; any outside
 *   it is rejected BY NAME (`Sub-field 'planningNotes.<x>' not allowed`). `'all'` imposes no sub-field gating.
 * - When `flows` is present and allowed at top level, the per-status flowsRule is applied:
 *     'forbidden'                -> any flows presence is rejected (defensive — usually flows is also out of allowedFields)
 *     'full'                     -> any flow shape is allowed: add, edit and delete alike, embedded
 *                                   observables included. ONE check still runs — see below.
 *
 * TWO CHECKS RUN ON EVERY ALLOWED `flows` WRITE, UNDER `'full'` INCLUDED, because each polices
 * something the allowlist never did and neither becomes acceptable by opening a status up:
 *   `questSignoffUnknownUnitViolationsTransformer` — WHAT MAY BE ADDRESSED. A sign-off naming an id
 *     the graph does not hold is APPENDED by the upsert as a brand-new unit, so one logical unit
 *     gets a second, phantom home that no later read can tell from the real one.
 *   `questSignoffCoupledEditViolationsTransformer` — WHAT MAY RIDE ALONG. The session that builds an
 *     artifact is the session that signs it, so an element free to carry a sign-off and an edit in
 *     one payload can move the goalposts to whatever it produced and leave only the agreement on
 *     the quest.
 * Both are data corruption rather than an over-wide permission.
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { inspectableModifyQuestInputFieldsStatics } from '../../statics/inspectable-modify-quest-input-fields/inspectable-modify-quest-input-fields-statics';
import {
  questStatusInputAllowlistStatics,
  type QuestStatusFlowsRule,
} from '../../statics/quest-status-input-allowlist/quest-status-input-allowlist-statics';
import { questSignoffCoupledEditViolationsTransformer } from '../quest-signoff-coupled-edit-violations/quest-signoff-coupled-edit-violations-transformer';
import { questSignoffUnknownUnitViolationsTransformer } from '../quest-signoff-unknown-unit-violations/quest-signoff-unknown-unit-violations-transformer';

type Quest = ReturnType<typeof QuestStub>;

export const questInputForbiddenFieldsTransformer = ({
  input,
  currentQuest,
  currentStatus,
  nextStatus,
}: {
  input: ModifyQuestInput;
  currentQuest: Quest;
  currentStatus: QuestStatus;
  nextStatus?: QuestStatus;
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];
  const entry = questStatusInputAllowlistStatics[currentStatus];
  const allowedSet = new Set<unknown>(entry.allowedFields);

  const backTransition = 'backTransitionFields' in entry ? entry.backTransitionFields : undefined;
  if (
    backTransition !== undefined &&
    nextStatus !== undefined &&
    nextStatus === backTransition.toStatus
  ) {
    for (const field of backTransition.fields) {
      allowedSet.add(field);
    }
  }

  const planningNotesRule = entry.allowedPlanningNotesFields;
  const inputPlanningNotes = input.planningNotes;
  // planningNotes acceptance is one of three shapes per status:
  //  (a) top-level allowed — `planningNotes` is in `allowedFields`; a finite
  //      `allowedPlanningNotesFields` array then gates each sub-field by name below.
  //  (b) ungated — `allowedPlanningNotesFields` is `'all'` (only `in_progress`): `planningNotes`
  //      is accepted even though it is NOT in `allowedFields`, with no sub-field gating —
  //      operators write operationPlans and reviewers write blightLedger while the
  //      quest runs.
  //  (c) wholesale forbidden — neither (created/approved/explore_*/...); any `planningNotes` write
  //      is rejected with the blunt top-level message, since no sub-field is ever permitted there.
  const planningNotesTopLevelAllowed = allowedSet.has('planningNotes');
  const planningNotesUngated = planningNotesRule === 'all';
  const planningNotesAccepted = planningNotesTopLevelAllowed || planningNotesUngated;

  for (const field of inspectableModifyQuestInputFieldsStatics) {
    const value = input[field];
    if (value === undefined) {
      continue;
    }
    if (field === 'planningNotes' && planningNotesAccepted) {
      // Accepted as a top-level allowed field (a) or via the in_progress `'all'` ungating (b).
      // Sub-field gating, when it applies, is handled below.
      continue;
    }
    if (!allowedSet.has(field)) {
      offenders.push(
        errorMessageContract.parse(`Field '${field}' not allowed in status '${currentStatus}'`),
      );
    }
  }

  // Sub-field allowlist for planningNotes: enforced ONLY for statuses that accept planningNotes
  // top-level AND carry a finite `allowedPlanningNotesFields` array. Every sub-field being written
  // must appear in the array; any outside it is rejected by name. `'all'` is exempt.
  if (
    inputPlanningNotes !== undefined &&
    planningNotesTopLevelAllowed &&
    planningNotesRule !== 'all'
  ) {
    const allowedPlanningNotesSet = new Set<unknown>(planningNotesRule);
    for (const [subField, subValue] of Object.entries(inputPlanningNotes)) {
      if (subValue === undefined) {
        continue;
      }
      if (!allowedPlanningNotesSet.has(subField)) {
        offenders.push(
          errorMessageContract.parse(
            `Sub-field 'planningNotes.${subField}' not allowed in status '${currentStatus}'`,
          ),
        );
      }
    }
  }

  const flowsRule: QuestStatusFlowsRule = entry.flowsRule;
  const inputFlows = input.flows;

  if (inputFlows === undefined || !allowedSet.has('flows')) {
    return offenders;
  }

  if (flowsRule === 'forbidden') {
    offenders.push(errorMessageContract.parse(`Flows not allowed in status '${currentStatus}'`));
    return offenders;
  }

  // flowsRule === 'full'. The payload may add, edit and delete freely; what it may not do is sign a
  // unit the graph does not hold (the upsert would APPEND that id rather than reject it), or sign a
  // unit and rewrite that same unit in the one call.
  return [
    ...offenders,
    ...questSignoffUnknownUnitViolationsTransformer({ inputFlows, currentQuest }),
    ...questSignoffCoupledEditViolationsTransformer({ inputFlows }),
  ];
};
