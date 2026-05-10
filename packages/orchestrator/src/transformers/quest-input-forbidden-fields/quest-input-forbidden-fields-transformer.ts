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
 * - Nested-path carveout: `planningNotes` containing ONLY `blightReports` is permitted when the status's
 *   blightReportsRule is `'full'`, even if `planningNotes` itself is not in allowedFields. This lets Blightwarden
 *   write to `planningNotes.blightReports[]` during `in_progress` without unlocking the rest of `planningNotes`.
 * - Sub-field allowlist for planningNotes: when `planningNotes` is present in the input (permitted via either the
 *   top-level allowedFields entry OR the blight-only carveout), every sub-field present must appear in the
 *   per-status `allowedPlanningNotesFields` array. Any sub-field outside that list is rejected. This closes the
 *   gap where seek_scope/seek_synth/seek_walk used to accept any planningNotes.* sub-field.
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
  const inputPlanningNotes = input.planningNotes;
  // Nested-path carveout: when `planningNotes` is NOT in allowedFields but the only sub-field
  // the caller is writing is `blightReports` AND `blightReportsRule === 'full'`, the write is
  // permitted. This is how Blightwarden writes `planningNotes.blightReports[]` during `in_progress`
  // without opening the full `planningNotes` object to general writers at that status.
  const planningNotesBlightOnly =
    inputPlanningNotes !== undefined &&
    !allowedSet.has('planningNotes') &&
    blightReportsRule === 'full' &&
    Object.keys(inputPlanningNotes).every((key) => key === 'blightReports') &&
    inputPlanningNotes.blightReports !== undefined;

  for (const field of inspectableModifyQuestInputFieldsStatics) {
    const value = input[field];
    if (value === undefined) {
      continue;
    }
    if (field === 'planningNotes' && planningNotesBlightOnly) {
      continue;
    }
    if (!allowedSet.has(field)) {
      offenders.push(
        errorMessageContract.parse(`Field '${field}' not allowed in status '${currentStatus}'`),
      );
    }
  }

  // Sub-field allowlist for planningNotes: applies whenever planningNotes was accepted at the top
  // level (either via allowedFields OR via the blight-only carveout). Every sub-field being written
  // must appear in `allowedPlanningNotesFields`. This blocks a seek_walk writer from stamping
  // `scopeClassification`, a seek_synth writer from writing `walkFindings`, etc.
  if (
    inputPlanningNotes !== undefined &&
    (allowedSet.has('planningNotes') || planningNotesBlightOnly)
  ) {
    const allowedPlanningNotesSet = new Set<unknown>(entry.allowedPlanningNotesFields);
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
