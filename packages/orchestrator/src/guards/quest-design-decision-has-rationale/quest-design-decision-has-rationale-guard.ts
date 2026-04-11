/**
 * PURPOSE: Validates that every design decision has a non-empty rationale field
 *
 * USAGE:
 * questDesignDecisionHasRationaleGuard({designDecisions});
 * // Returns true if every design decision has a non-empty rationale, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch placeholder design decisions missing their explanatory text.
 */
import type { DesignDecisionStub } from '@dungeonmaster/shared/contracts';

type DesignDecision = ReturnType<typeof DesignDecisionStub>;

export const questDesignDecisionHasRationaleGuard = ({
  designDecisions,
}: {
  designDecisions?: DesignDecision[];
}): boolean => {
  if (!designDecisions) {
    return false;
  }

  return designDecisions.every((decision) => {
    const rationale = String(decision.rationale);
    return rationale.length > 0;
  });
};
