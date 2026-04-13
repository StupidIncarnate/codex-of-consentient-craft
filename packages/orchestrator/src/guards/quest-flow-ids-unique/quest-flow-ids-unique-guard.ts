/**
 * PURPOSE: Validates that all flow IDs within a quest are unique
 *
 * USAGE:
 * questFlowIdsUniqueGuard({flows});
 * // Returns true if no two flows share the same id, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch duplicate flow IDs before they corrupt references.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questFlowIdsUniqueGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  const seen = new Set<unknown>();

  for (const flow of flows) {
    const id = String(flow.id);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
  }

  return true;
};
