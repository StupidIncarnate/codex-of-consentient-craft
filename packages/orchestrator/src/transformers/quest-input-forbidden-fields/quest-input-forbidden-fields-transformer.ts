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
 * - Nested-path carveout: when `planningNotes` is NOT in allowedFields but the status's blightReportsRule is
 *   `'full'` (only `in_progress`), each planningNotes sub-field is validated individually against
 *   `allowedPlanningNotesFields` — letting Blightwarden/PathSeeker/Codeweaver write their own sub-field during
 *   `in_progress` without unlocking the rest of `planningNotes`.
 * - Sub-field allowlist for planningNotes: when `planningNotes` is present and the status accepts it (top-level
 *   allowedFields entry OR the nested-path carveout), every sub-field present must appear in the per-status
 *   `allowedPlanningNotesFields` array; any sub-field outside it is rejected BY NAME (`Sub-field
 *   'planningNotes.<x>' not allowed`) so the writer knows exactly which sub-field tripped the gate. A status that
 *   accepts no planningNotes sub-fields at all rejects the whole field with the blunt `Field 'planningNotes' not
 *   allowed` instead.
 * - When `flows` is present and allowed at top level, the per-status flowsRule is applied:
 *     'forbidden'                -> any flows presence is rejected (defensive — usually flows is also out of allowedFields)
 *     'full'                     -> any flow shape is allowed
 *     'no-observables'           -> flows OK, but flows[].nodes[].observables must not contain entries (length 0)
 *     'observable-wording-only'  -> delegates to questFlowWordingOnlyViolationsTransformer
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { inspectableModifyQuestInputFieldsStatics } from '../../statics/inspectable-modify-quest-input-fields/inspectable-modify-quest-input-fields-statics';
import {
  questStatusInputAllowlistStatics,
  type QuestStatusBlightReportsRule,
  type QuestStatusFlowsRule,
} from '../../statics/quest-status-input-allowlist/quest-status-input-allowlist-statics';
import { questFlowWordingOnlyViolationsTransformer } from '../quest-flow-wording-only-violations/quest-flow-wording-only-violations-transformer';

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

  const blightReportsRule: QuestStatusBlightReportsRule = entry.blightReportsRule;
  const allowedPlanningNotesSet = new Set<unknown>(entry.allowedPlanningNotesFields);
  const inputPlanningNotes = input.planningNotes;
  // planningNotes acceptance is one of three shapes per status:
  //  (a) top-level allowed — `planningNotes` is in `allowedFields` (seek_scope/seek_synth/seek_walk).
  //  (b) nested-path carveout — `planningNotes` is NOT in `allowedFields`, but `blightReportsRule:
  //      'full'` opens per-sub-field acceptance for the sub-fields in `allowedPlanningNotesFields`.
  //      `in_progress` is the only such status; it permits exactly the sub-fields written during
  //      execution: `scopeClassification` (PathSeeker (re)classifying scope — the auto-seed from
  //      Start plus any walk-time scope-creep re-slice), `blightReports` (Blightwarden),
  //      `walkFindings` (pathseeker-walk's terminal commit), and `codeweaverPlans` (Codeweaver's
  //      living per-slice tactical plan). The rest of `planningNotes` stays closed to general writers.
  //  (c) wholesale forbidden — neither (created/approved/explore_*/...); any `planningNotes` write
  //      is rejected with the blunt top-level message, since no sub-field is ever permitted there.
  // In shapes (a) and (b) the per-sub-field loop below validates each sub-field individually and
  // names the specific offender (`Sub-field 'planningNotes.<x>' not allowed`), so a writer that picks
  // the wrong sub-field gets an actionable message instead of the blunt `Field 'planningNotes' not
  // allowed` that hides which sub-field tripped the gate.
  const planningNotesTopLevelAllowed = allowedSet.has('planningNotes');
  const planningNotesCarveoutAvailable =
    inputPlanningNotes !== undefined &&
    !planningNotesTopLevelAllowed &&
    blightReportsRule === 'full';

  for (const field of inspectableModifyQuestInputFieldsStatics) {
    const value = input[field];
    if (value === undefined) {
      continue;
    }
    if (field === 'planningNotes' && planningNotesCarveoutAvailable) {
      // Defer to the per-sub-field validation below, which names the specific offending sub-field
      // rather than emitting the blunt top-level rejection.
      continue;
    }
    if (!allowedSet.has(field)) {
      offenders.push(
        errorMessageContract.parse(`Field '${field}' not allowed in status '${currentStatus}'`),
      );
    }
  }

  // Sub-field allowlist for planningNotes: runs whenever the status accepts planningNotes at all —
  // top-level (a) or via the nested-path carveout (b). Every sub-field being written must appear in
  // `allowedPlanningNotesFields`; any outside it is rejected by name. This blocks a seek_walk writer
  // from stamping `scopeClassification`, an in_progress writer from stamping `surfaceReports`, etc.
  if (
    inputPlanningNotes !== undefined &&
    (planningNotesTopLevelAllowed || planningNotesCarveoutAvailable)
  ) {
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

  if (flowsRule === 'full') {
    return offenders;
  }

  if (flowsRule === 'no-observables') {
    for (const flow of inputFlows) {
      const flowId = String(flow.id);
      const nodes = 'nodes' in flow ? flow.nodes : undefined;
      if (nodes === undefined) {
        continue;
      }
      for (const node of nodes) {
        const nodeId = String(node.id);
        const observables = 'observables' in node ? node.observables : undefined;
        if (observables !== undefined && observables.length > 0) {
          offenders.push(
            errorMessageContract.parse(
              `Observables not allowed in flow '${flowId}' node '${nodeId}' in status '${currentStatus}' (Phase 4 work — embed observables after flows are approved)`,
            ),
          );
        }
      }
    }
    return offenders;
  }

  // flowsRule === 'observable-wording-only'
  const wordingViolations = questFlowWordingOnlyViolationsTransformer({
    inputFlows,
    currentQuest,
    currentStatus,
  });
  return [...offenders, ...wordingViolations];
};
