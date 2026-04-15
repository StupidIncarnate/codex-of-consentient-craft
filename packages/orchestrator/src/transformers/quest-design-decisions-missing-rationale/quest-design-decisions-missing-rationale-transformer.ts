/**
 * PURPOSE: Returns descriptions of design decisions with empty rationale
 *
 * USAGE:
 * questDesignDecisionsMissingRationaleTransformer({designDecisions});
 * // Returns ErrorMessage[] — e.g. ["design decision 'use-jwt' has empty rationale"].
 */
import type { DesignDecisionStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type DesignDecision = ReturnType<typeof DesignDecisionStub>;

export const questDesignDecisionsMissingRationaleTransformer = ({
  designDecisions,
}: {
  designDecisions?: DesignDecision[];
}): ErrorMessage[] => {
  if (!designDecisions) {
    return [];
  }

  const offenders: ErrorMessage[] = [];

  for (const decision of designDecisions) {
    const { rationale } = decision;
    const isEmpty = typeof rationale !== 'string' || rationale.length === 0;
    if (isEmpty) {
      offenders.push(
        errorMessageContract.parse(`design decision '${String(decision.id)}' has empty rationale`),
      );
    }
  }

  return offenders;
};
