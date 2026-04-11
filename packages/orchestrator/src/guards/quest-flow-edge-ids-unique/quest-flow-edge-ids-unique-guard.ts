/**
 * PURPOSE: Validates that edge IDs are unique within each flow (duplicates across flows are allowed)
 *
 * USAGE:
 * questFlowEdgeIdsUniqueGuard({flows});
 * // Returns true if every flow's edge IDs are unique within that flow, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch duplicate edge IDs that would collide during rendering.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questFlowEdgeIdsUniqueGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  return flows.every((flow) => {
    const seen = new Set<unknown>();
    for (const edge of flow.edges) {
      const id = String(edge.id);
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
    }
    return true;
  });
};
