/**
 * PURPOSE: Defines the branded UUID type for ToolingRequirement identifiers
 *
 * USAGE:
 * toolingRequirementIdContract.parse('d4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a');
 * // Returns: ToolingRequirementId branded string
 */

import { z } from 'zod';

export const toolingRequirementIdContract = z.string().uuid().brand<'ToolingRequirementId'>();

export type ToolingRequirementId = z.infer<typeof toolingRequirementIdContract>;
