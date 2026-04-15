/**
 * PURPOSE: Returns descriptions of every flow/node/edge/observable mutation that exceeds the "observable-wording-only" allowance
 *
 * USAGE:
 * questFlowWordingOnlyViolationsTransformer({inputFlows: input.flows, currentQuest, currentStatus: 'in_progress'});
 * // Returns ErrorMessage[] of violations: flow add/delete, node add/delete, edge add/delete, observable add/delete.
 * // Empty array means every entry in `inputFlows` is an in-place wording rewrite of an existing observable.
 */
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;
type InputFlows = NonNullable<ModifyQuestInput['flows']>;
type InputFlow = InputFlows extends readonly (infer Item)[] ? Item : never;

export const questFlowWordingOnlyViolationsTransformer = ({
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

    if (existingFlow === undefined) {
      offenders.push(
        errorMessageContract.parse(
          `Flow add not allowed in status '${currentStatus}' (attempted to add flow '${flowId}')`,
        ),
      );
      continue;
    }

    // The delete-only flow shape (second union branch) has no nodes/edges fields.
    const inputNodes = 'nodes' in flow ? flow.nodes : undefined;
    if (inputNodes !== undefined) {
      for (const node of inputNodes) {
        const nodeId = String(node.id);
        const nodeDeleteMarked = node._delete === true;
        const existingNode = existingFlow.nodes.find((n) => String(n.id) === nodeId);

        if (nodeDeleteMarked) {
          offenders.push(
            errorMessageContract.parse(
              `Node delete not allowed in status '${currentStatus}' (attempted to delete node '${nodeId}' from flow '${flowId}')`,
            ),
          );
          continue;
        }

        if (existingNode === undefined) {
          offenders.push(
            errorMessageContract.parse(
              `Node add not allowed in status '${currentStatus}' (attempted to add node '${nodeId}' to flow '${flowId}')`,
            ),
          );
          continue;
        }

        const inputObservables = 'observables' in node ? node.observables : undefined;
        if (inputObservables !== undefined) {
          for (const observable of inputObservables) {
            const observableId = String(observable.id);
            const observableDeleteMarked = observable._delete === true;
            const existingObservable = existingNode.observables.find(
              (o) => String(o.id) === observableId,
            );

            if (observableDeleteMarked) {
              offenders.push(
                errorMessageContract.parse(
                  `Observable delete not allowed in status '${currentStatus}' (attempted to delete observable '${observableId}' from node '${nodeId}' in flow '${flowId}') — only wording replacement on existing observables`,
                ),
              );
              continue;
            }

            if (existingObservable === undefined) {
              offenders.push(
                errorMessageContract.parse(
                  `Observable add not allowed in status '${currentStatus}' (attempted to add observable '${observableId}' to node '${nodeId}' in flow '${flowId}') — only wording replacement on existing observables`,
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
        const edgeId = String(edge.id);
        const edgeDeleteMarked = edge._delete === true;
        const existingEdge = existingFlow.edges.find((e) => String(e.id) === edgeId);

        if (edgeDeleteMarked) {
          offenders.push(
            errorMessageContract.parse(
              `Edge delete not allowed in status '${currentStatus}' (attempted to delete edge '${edgeId}' from flow '${flowId}')`,
            ),
          );
          continue;
        }

        if (existingEdge === undefined) {
          offenders.push(
            errorMessageContract.parse(
              `Edge add not allowed in status '${currentStatus}' (attempted to add edge '${edgeId}' to flow '${flowId}')`,
            ),
          );
        }
      }
    }
  }

  return offenders;
};
