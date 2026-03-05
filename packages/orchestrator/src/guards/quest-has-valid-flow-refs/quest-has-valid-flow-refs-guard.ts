/**
 * PURPOSE: Validates that all flow edge from/to references point to existing node IDs within the same flow
 *
 * USAGE:
 * questHasValidFlowRefsGuard({flows});
 * // Returns true if all edge refs are valid node IDs or cross-flow refs, false otherwise
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

  return flows.every((flow) => {
    const nodeIds = new Set(flow.nodes.map((node) => String(node.id)));

    return flow.edges.every((edge) => {
      const fromRef = String(edge.from);
      const toRef = String(edge.to);

      const fromValid = fromRef.includes(':') || nodeIds.has(fromRef);
      const toValid = toRef.includes(':') || nodeIds.has(toRef);

      return fromValid && toValid;
    });
  });
};
