/**
 * PURPOSE: Validates that non-terminal flow nodes have at least one outgoing edge (no dead ends)
 *
 * USAGE:
 * questFlowNoDeadEndsGuard({flows});
 * // Returns true if every non-terminal node has >=1 outgoing edge, false if any non-terminal node is a dead end
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch structural bugs where a non-terminal node has nowhere to go.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questFlowNoDeadEndsGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  return flows.every((flow) => {
    const nodesWithOutgoing = new Set<unknown>();
    for (const edge of flow.edges) {
      nodesWithOutgoing.add(String(edge.from));
    }

    return flow.nodes.every((node) => {
      if (node.type === 'terminal') {
        return true;
      }
      return nodesWithOutgoing.has(String(node.id));
    });
  });
};
