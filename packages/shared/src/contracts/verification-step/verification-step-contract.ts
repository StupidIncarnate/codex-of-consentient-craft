/**
 * PURPOSE: Defines a single verification step for observable acceptance criteria
 *
 * USAGE:
 * verificationStepContract.parse({action: 'assert', target: 'response.status', value: '200', condition: 'equals', type: 'api-call'});
 * // Returns: VerificationStep object
 */

import { z } from 'zod';

import { outcomeTypeContract } from '../outcome-type/outcome-type-contract';

export const verificationStepContract = z.object({
  action: z.string().min(1).brand<'VerificationAction'>(),
  target: z.string().min(1).brand<'VerificationTarget'>().optional(),
  value: z.string().brand<'VerificationValue'>().optional(),
  condition: z.string().min(1).brand<'VerificationCondition'>().optional(),
  type: outcomeTypeContract.optional(),
});

export type VerificationStep = z.infer<typeof verificationStepContract>;
