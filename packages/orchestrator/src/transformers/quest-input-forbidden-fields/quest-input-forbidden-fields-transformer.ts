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
 * - When `flows` is present and allowed at top level, the per-status flowsRule is applied:
 *     'forbidden'                -> any flows presence is rejected (defensive — usually flows is also out of allowedFields)
 *     'full'                     -> any flow shape is allowed
 *     'no-observables'           -> flows OK, but flows[].nodes[].observables must not contain entries (length 0)
 *     'observable-wording-only'  -> delegates to questFlowWordingOnlyViolationsTransformer
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { ModifyQuestInput } from '../../contracts/modify-quest-input/modify-quest-input-contract';
import { inspectableModifyQuestInputFieldsStatics } from '../../statics/inspectable-modify-quest-input-fields/inspectable-modify-quest-input-fields-statics';
import {
  questStatusInputAllowlistStatics,
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

  for (const field of inspectableModifyQuestInputFieldsStatics) {
    const value = Reflect.get(input, field);
    if (value === undefined) {
      continue;
    }
    if (!allowedSet.has(field)) {
      offenders.push(
        errorMessageContract.parse(`Field '${field}' not allowed in status '${currentStatus}'`),
      );
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
