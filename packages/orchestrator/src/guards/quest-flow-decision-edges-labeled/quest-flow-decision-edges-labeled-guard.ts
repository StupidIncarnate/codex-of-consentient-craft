/**
 * PURPOSE: Validates that every edge leaving a decision node has a non-empty label
 *
 * USAGE:
 * questFlowDecisionEdgesLabeledGuard({flows});
 * // Returns true if every edge from a decision node has a label, false if any is missing one
 *
 * WHEN-TO-USE: validate-spec pipeline, to ensure decision branch conditions are labeled on the rendered diagram.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questFlowDecisionEdgesLabeledGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  return flows.every((flow) => {
    const decisionNodeIds = new Set<unknown>();
    for (const node of flow.nodes) {
      if (node.type === 'decision') {
        decisionNodeIds.add(String(node.id));
      }
    }

    return flow.edges.every((edge) => {
      if (!decisionNodeIds.has(String(edge.from))) {
        return true;
      }
      return edge.label !== undefined && String(edge.label).length > 0;
    });
  });
};
