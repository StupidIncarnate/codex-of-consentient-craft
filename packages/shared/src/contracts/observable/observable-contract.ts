/**
 * PURPOSE: Defines the Observable structure for BDD-style acceptance criteria (Given/When/Then)
 *
 * USAGE:
 * observableContract.parse({id: 'obs-123', contextId: 'ctx-123', trigger: 'Click button', dependsOn: [], outcomes: []});
 * // Returns: Observable object
 */

import { z } from 'zod';

import { contextIdContract } from '../context-id/context-id-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { outcomeTypeContract } from '../outcome-type/outcome-type-contract';
import { requirementIdContract } from '../requirement-id/requirement-id-contract';
import { verificationStepContract } from '../verification-step/verification-step-contract';

const outcomeRefContract = z.object({
  type: outcomeTypeContract,
  description: z.string().brand<'OutcomeDescription'>(),
  criteria: z.record(z.unknown()),
});

export const observableContract = z.object({
  id: observableIdContract,
  contextId: contextIdContract,
  requirementId: requirementIdContract.optional(),
  trigger: z.string().min(1).brand<'TriggerDescription'>(),
  dependsOn: z.array(observableIdContract),
  outcomes: z.array(outcomeRefContract),
  verificationStatus: z.enum(['pending', 'verified', 'failed']).optional(),
  verifiedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  verificationNotes: z.string().brand<'VerificationNotes'>().optional(),
  verification: z.array(verificationStepContract).default([]),
});

export type Observable = z.infer<typeof observableContract>;
