/**
 * PURPOSE: Returns the list of duplicated design-decision IDs in a quest (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateDesignDecisionIdsTransformer({designDecisions});
 * // Returns ErrorMessage[] — each entry is a duplicated design decision id.
 */
import type { DesignDecisionStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type DesignDecision = ReturnType<typeof DesignDecisionStub>;

export const questDuplicateDesignDecisionIdsTransformer = ({
  designDecisions,
}: {
  designDecisions?: DesignDecision[];
}): ErrorMessage[] => {
  if (!designDecisions) {
    return [];
  }

  const seen = new Set<unknown>();
  const duplicates = new Set<unknown>();

  for (const decision of designDecisions) {
    const id = String(decision.id);
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  }

  return Array.from(duplicates).map((id) => errorMessageContract.parse(String(id)));
};
