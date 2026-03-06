/**
 * PURPOSE: Defines the branded kebab-case type for Flow identifiers
 *
 * USAGE:
 * flowIdContract.parse('login-flow');
 * // Returns: FlowId branded string
 */

import { z } from 'zod';

export const flowIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'FlowId'>();

export type FlowId = z.infer<typeof flowIdContract>;
