/**
 * PURPOSE: Defines the ToolingRequirement structure for identifying needed packages/tools
 *
 * USAGE:
 * toolingRequirementContract.parse({id: 'tr-123', name: 'PostgreSQL Driver', packageName: 'pg', reason: 'DB verification', requiredByObservables: []});
 * // Returns: ToolingRequirement object
 */

import { z } from '#gateway/npm/zod';

import { flowObservableContract } from '../flow-observable/flow-observable-contract';

export const toolingRequirementContract = z.object({
  id: z.string().min(1).regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u).brand<'ToolingRequirementId'>(),
  name: z.string().min(1).brand<'ToolingRequirementName'>(),
  packageName: z.string().min(1).brand<'ToolingRequirementPackageName'>(),
  reason: z.string().brand<'ToolingRequirementReason'>(),
  requiredByObservables: z.array(flowObservableContract.shape.id),
}).brand<'ToolingRequirement'>();

export type ToolingRequirement = z.infer<typeof toolingRequirementContract>;
