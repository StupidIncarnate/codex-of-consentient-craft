/**
 * PURPOSE: Defines the branded kebab-case type for DesignDecision identifiers
 *
 * USAGE:
 * designDecisionIdContract.parse('use-jwt-auth');
 * // Returns: DesignDecisionId branded string
 */

import { z } from 'zod';

export const designDecisionIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'DesignDecisionId'>();

export type DesignDecisionId = z.infer<typeof designDecisionIdContract>;
