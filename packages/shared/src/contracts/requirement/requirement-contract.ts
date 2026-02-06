/**
 * PURPOSE: Defines the Requirement structure for high-level feature intent
 *
 * USAGE:
 * requirementContract.parse({id: 'req-uuid', name: 'CLI Interactive Mode', description: '...', scope: 'packages/cli', status: 'proposed'});
 * // Returns: Requirement object
 */

import { z } from 'zod';

import { requirementIdContract } from '../requirement-id/requirement-id-contract';

export const requirementContract = z.object({
  id: requirementIdContract,
  name: z.string().min(1).brand<'RequirementName'>(),
  description: z.string().brand<'RequirementDescription'>(),
  scope: z.string().brand<'RequirementScope'>(),
  status: z.enum(['proposed', 'approved', 'deferred']).optional(),
});

export type Requirement = z.infer<typeof requirementContract>;
