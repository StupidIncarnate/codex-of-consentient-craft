/**
 * PURPOSE: Returns descriptions of non-terminal flow nodes that have no outgoing edges
 *
 * USAGE:
 * questDeadEndFlowNodesTransformer({flows});
 * // Returns ErrorMessage[] — e.g. ["flow 'login' node 'stuck' (type state) has no outgoing edge"].
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questDeadEndFlowNodesTransformer = ({ flows }: { flows?: Flow[] }): ErrorMessage[] => {
  if (!flows) {
    return [];
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    const nodesWithOutgoing = new Set<unknown>();
    for (const edge of flow.edges) {
      nodesWithOutgoing.add(String(edge.from));
    }

    for (const node of flow.nodes) {
      if (node.type === 'terminal') {
        continue;
      }
      if (!nodesWithOutgoing.has(String(node.id))) {
        offenders.push(
          errorMessageContract.parse(
            `flow '${String(flow.id)}' node '${String(node.id)}' (type ${node.type}) has no outgoing edge`,
          ),
        );
      }
    }
  }

  return offenders;
};
