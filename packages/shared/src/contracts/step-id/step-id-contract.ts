/**
 * PURPOSE: Defines the branded kebab-case type for DependencyStep identifiers
 *
 * USAGE:
 * stepIdContract.parse('create-login-api');
 * // Returns: StepId branded string
 */

import { z } from 'zod';

export const stepIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'StepId'>();

export type StepId = z.infer<typeof stepIdContract>;
