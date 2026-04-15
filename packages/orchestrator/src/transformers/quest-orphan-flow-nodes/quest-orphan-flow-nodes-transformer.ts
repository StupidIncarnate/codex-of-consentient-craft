/**
 * PURPOSE: Returns descriptions of flow nodes that are not connected to any edge (orphans)
 *
 * USAGE:
 * questOrphanFlowNodesTransformer({flows});
 * // Returns ErrorMessage[] — e.g. ["flow 'login' has orphan node 'extra'"].
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questOrphanFlowNodesTransformer = ({ flows }: { flows?: Flow[] }): ErrorMessage[] => {
  if (!flows) {
    return [];
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    const connectedNodeIds = new Set<unknown>();
    for (const edge of flow.edges) {
      connectedNodeIds.add(String(edge.from));
      connectedNodeIds.add(String(edge.to));
    }

    for (const node of flow.nodes) {
      if (!connectedNodeIds.has(String(node.id))) {
        offenders.push(
          errorMessageContract.parse(
            `flow '${String(flow.id)}' has orphan node '${String(node.id)}'`,
          ),
        );
      }
    }
  }

  return offenders;
};
