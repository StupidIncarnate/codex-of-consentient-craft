/**
 * PURPOSE: Validates that all flow edge from/to references point to existing node IDs within the same flow, and that any cross-flow references (flowId:nodeId) resolve to an existing flow and node
 *
 * USAGE:
 * questHasValidFlowRefsGuard({flows});
 * // Returns true if all edge refs are valid node IDs or resolvable cross-flow refs, false otherwise
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questHasValidFlowRefsGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  if (flows.length === 0) {
    return true;
  }

  const nodeIdsByFlowId = new Map<unknown, Set<unknown>>();
  for (const flow of flows) {
    const nodeIds = new Set<unknown>();
    for (const node of flow.nodes) {
      nodeIds.add(String(node.id));
    }
    nodeIdsByFlowId.set(String(flow.id), nodeIds);
  }

  return flows.every((flow) => {
    const currentFlowNodeIds = nodeIdsByFlowId.get(String(flow.id)) ?? new Set<unknown>();

    return flow.edges.every((edge) => {
      const fromRef = String(edge.from);
      const toRef = String(edge.to);

      const refs = [fromRef, toRef];

      return refs.every((ref) => {
        if (ref.includes(':')) {
          const [flowIdPart, nodeIdPart] = ref.split(':');
          if (
            flowIdPart === undefined ||
            nodeIdPart === undefined ||
            flowIdPart.length === 0 ||
            nodeIdPart.length === 0
          ) {
            return false;
          }
          const targetNodeIds = nodeIdsByFlowId.get(flowIdPart);
          if (!targetNodeIds) {
            return false;
          }
          return targetNodeIds.has(nodeIdPart);
        }
        return currentFlowNodeIds.has(ref);
      });
    });
  });
};
