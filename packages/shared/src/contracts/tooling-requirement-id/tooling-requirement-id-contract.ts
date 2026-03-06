/**
 * PURPOSE: Defines the branded kebab-case type for ToolingRequirement identifiers
 *
 * USAGE:
 * toolingRequirementIdContract.parse('pg-driver');
 * // Returns: ToolingRequirementId branded string
 */

import { z } from 'zod';

export const toolingRequirementIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'ToolingRequirementId'>();

export type ToolingRequirementId = z.infer<typeof toolingRequirementIdContract>;
