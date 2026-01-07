/**
 * PURPOSE: Defines the ToolingRequirement structure for identifying needed packages/tools
 *
 * USAGE:
 * toolingRequirementContract.parse({id: 'tr-123', name: 'PostgreSQL Driver', packageName: 'pg', reason: 'DB verification', requiredByObservables: []});
 * // Returns: ToolingRequirement object
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { toolingRequirementIdContract } from '../tooling-requirement-id/tooling-requirement-id-contract';

export const toolingRequirementContract = z.object({
  id: toolingRequirementIdContract,
  name: z.string().min(1).brand<'ToolingName'>(),
  packageName: z.string().min(1).brand<'NpmPackageName'>(),
  reason: z.string().brand<'ToolingReason'>(),
  requiredByObservables: z.array(observableIdContract),
});

export type ToolingRequirement = z.infer<typeof toolingRequirementContract>;
