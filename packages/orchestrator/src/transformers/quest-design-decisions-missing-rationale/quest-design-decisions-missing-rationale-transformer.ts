/**
 * PURPOSE: Returns descriptions of design decisions with empty rationale
 *
 * USAGE:
 * questDesignDecisionsMissingRationaleTransformer({designDecisions});
 * // Returns ErrorMessage[] — e.g. ["design decision 'use-jwt' has empty rationale"].
 */
import type { DesignDecision } from '@dungeonmaster/shared/contracts';

export const questDesignDecisionsMissingRationaleTransformer = ({
  designDecisions,
}: {
  designDecisions?: DesignDecision[];
}): string[] => {
  if (!designDecisions) {
    return [];
  }

  const offenders: string[] = [];

  for (const decision of designDecisions) {
    const { rationale } = decision;
    const isEmpty = typeof rationale !== 'string' || rationale.length === 0;
    if (isEmpty) {
      offenders.push(
        `design decision '${String(decision.id)}' has empty rationale`,
      );
    }
  }

  return offenders;
};
