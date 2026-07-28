/**
 * PURPOSE: Returns descriptions of every flow mutation that exceeds the "additive-only" allowance —
 * the rule that lets an execution agent record what it discovered without letting it shrink the
 * acceptance target it is judged against
 *
 * USAGE:
 * questFlowAdditiveOnlyViolationsTransformer({inputFlows: input.flows, currentQuest, currentStatus: 'in_progress'});
 * // Returns ErrorMessage[] of violations: any delete, or adding a whole new flow.
 * // Empty array means every entry in `inputFlows` only adds nodes/edges/observables to an existing
 * // flow, or rewords an existing observable.
 *
 * Adding is safe and deleting is not, which is why the rule is asymmetric: a node, edge, or
 * observable an agent adds puts MORE constraint on itself (a branch it found, an assertion it now
 * owes), so it can never be used to slip past a gate. A delete — or swapping in a whole new flow —
 * could erase the very outcome the verify roles later assert on.
 */
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;
type InputFlows = NonNullable<ModifyQuestInput['flows']>;
type InputFlow = InputFlows extends readonly (infer Item)[] ? Item : never;

export const questFlowAdditiveOnlyViolationsTransformer = ({
  inputFlows,
  currentQuest,
  currentStatus,
}: {
  inputFlows: readonly InputFlow[];
  currentQuest: Quest;
  currentStatus: QuestStatus;
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];

  for (const flow of inputFlows) {
    const flowId = String(flow.id);
    const flowDeleteMarked = flow._delete === true;
    const existingFlow = currentQuest.flows.find((f) => String(f.id) === flowId);

    if (flowDeleteMarked) {
      offenders.push(
        errorMessageContract.parse(
          `Flow delete not allowed in status '${currentStatus}' (attempted to delete flow '${flowId}')`,
        ),
      );
      continue;
    }

    // A whole new flow is a new acceptance target, not a discovery inside an existing one.
    if (existingFlow === undefined) {
      offenders.push(
        errorMessageContract.parse(
          `Flow add not allowed in status '${currentStatus}' (attempted to add flow '${flowId}') — you may add nodes, edges, and observables to an EXISTING flow, but not a new flow`,
        ),
      );
      continue;
    }

    // The delete-only flow shape (second union branch) has no nodes/edges fields.
    const inputNodes = 'nodes' in flow ? flow.nodes : undefined;
    if (inputNodes !== undefined) {
      for (const node of inputNodes) {
        const nodeId = String(node.id);
        if (node._delete === true) {
          offenders.push(
            errorMessageContract.parse(
              `Node delete not allowed in status '${currentStatus}' (attempted to delete node '${nodeId}' from flow '${flowId}')`,
            ),
          );
          continue;
        }

        const inputObservables = 'observables' in node ? node.observables : undefined;
        if (inputObservables !== undefined) {
          for (const observable of inputObservables) {
            if (observable._delete === true) {
              offenders.push(
                errorMessageContract.parse(
                  `Observable delete not allowed in status '${currentStatus}' (attempted to delete observable '${String(observable.id)}' from node '${nodeId}' in flow '${flowId}') — you may add observables, never remove one`,
                ),
              );
            }
          }
        }
      }
    }

    const inputEdges = 'edges' in flow ? flow.edges : undefined;
    if (inputEdges !== undefined) {
      for (const edge of inputEdges) {
        if (edge._delete === true) {
          offenders.push(
            errorMessageContract.parse(
              `Edge delete not allowed in status '${currentStatus}' (attempted to delete edge '${String(edge.id)}' from flow '${flowId}')`,
            ),
          );
        }
      }
    }
  }

  return offenders;
};
