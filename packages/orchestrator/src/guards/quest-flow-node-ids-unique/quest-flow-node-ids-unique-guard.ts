/**
 * PURPOSE: Validates that node IDs are unique within each flow (duplicates across different flows are allowed)
 *
 * USAGE:
 * questFlowNodeIdsUniqueGuard({flows});
 * // Returns true if every flow's node IDs are unique within that flow, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch duplicate node IDs that would corrupt edge references.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questFlowNodeIdsUniqueGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  return flows.every((flow) => {
    const seen = new Set<unknown>();
    for (const node of flow.nodes) {
      const id = String(node.id);
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
    }
    return true;
  });
};
