/**
 * PURPOSE: Defines a branded RunId type matching timestamp-hex pattern
 *
 * USAGE:
 * runIdContract.parse('1739625600000-a3f1');
 * // Returns: RunId branded string
 */

import { z } from 'zod';

export const runIdContract = z
  .string()
  .regex(/^\d+-[a-f0-9]+$/u, 'Invalid RunId format: expected timestamp-hex pattern')
  .brand<'RunId'>();

export type RunId = z.infer<typeof runIdContract>;
