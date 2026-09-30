/**
 * PURPOSE: Defines the ToolingRequirement structure for identifying needed packages/tools
 *
 * USAGE:
 * toolingRequirementContract.parse({id: 'tr-123', name: 'PostgreSQL Driver', packageName: 'pg', reason: 'DB verification', requiredByObservables: []});
 * // Returns: ToolingRequirement object
 */

import { z } from '#gateway/npm/zod';

import { toolingRequirementIdContract } from '../tooling-requirement-id/tooling-requirement-id-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';

export const toolingRequirementContract = z.object({
  id: toolingRequirementIdContract,
  name: z.string().min(1).brand<'ToolingName'>(),
  packageName: z.string().min(1).brand<'NpmPackageName'>(),
  reason: z.string().brand<'ToolingReason'>(),
  requiredByObservables: z.array(flowObservableContract.shape.id),
});

export type ToolingRequirement = z.infer<typeof toolingRequirementContract>;
