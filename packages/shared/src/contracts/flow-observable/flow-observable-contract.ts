/**
 * PURPOSE: Defines the FlowObservable structure for outcome-based acceptance criteria embedded in flow nodes
 *
 * USAGE:
 * flowObservableContract.parse({id: 'uuid', then: [{type: 'ui-state', description: 'shows dialog'}]});
 * // Returns: FlowObservable object
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { outcomeTypeContract } from '../outcome-type/outcome-type-contract';

const flowOutcomeContract = z.object({
  type: outcomeTypeContract,
  description: z.string().brand<'OutcomeDescription'>(),
});

export const flowObservableContract = z.object({
  id: observableIdContract,
  then: z.array(flowOutcomeContract),
  designRef: z.string().brand<'DesignRef'>().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'failed']).optional(),
  verifiedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  verificationNotes: z.string().brand<'VerificationNotes'>().optional(),
});

export type FlowObservable = z.infer<typeof flowObservableContract>;
