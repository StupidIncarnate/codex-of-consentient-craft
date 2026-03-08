/**
 * PURPOSE: Defines valid execution role values for step assignments
 *
 * USAGE:
 * executionRoleContract.parse('codeweaver');
 * // Returns: ExecutionRole branded enum value
 */

import { z } from 'zod';

export const executionRoleContract = z.enum([
  'pathseeker',
  'codeweaver',
  'ward',
  'spiritmender',
  'siegemaster',
  'lawbringer',
]);

export type ExecutionRole = z.infer<typeof executionRoleContract>;
