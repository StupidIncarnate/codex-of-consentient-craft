/**
 * PURPOSE: Validates that all design decision IDs are unique within a quest
 *
 * USAGE:
 * questDesignDecisionIdsUniqueGuard({designDecisions});
 * // Returns true if no two design decisions share the same id, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch duplicate design decision IDs.
 */
import type { DesignDecisionStub } from '@dungeonmaster/shared/contracts';

type DesignDecision = ReturnType<typeof DesignDecisionStub>;

export const questDesignDecisionIdsUniqueGuard = ({
  designDecisions,
}: {
  designDecisions?: DesignDecision[];
}): boolean => {
  if (!designDecisions) {
    return false;
  }

  const seen = new Set<unknown>();

  for (const decision of designDecisions) {
    const id = String(decision.id);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
  }

  return true;
};
