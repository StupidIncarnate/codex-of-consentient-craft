/**
 * PURPOSE: Defines the DesignDecision structure for recording architectural choices
 *
 * USAGE:
 * designDecisionContract.parse({id: 'dd-uuid', title: 'Use JWT for auth', rationale: '...', relatedRequirements: []});
 * // Returns: DesignDecision object
 */

import { z } from 'zod';

import { designDecisionIdContract } from '../design-decision-id/design-decision-id-contract';
import { requirementIdContract } from '../requirement-id/requirement-id-contract';

export const designDecisionContract = z.object({
  id: designDecisionIdContract,
  title: z.string().min(1).brand<'DecisionTitle'>(),
  rationale: z.string().brand<'DecisionRationale'>(),
  relatedRequirements: z.array(requirementIdContract),
});

export type DesignDecision = z.infer<typeof designDecisionContract>;
