/**
 * PURPOSE: Defines valid execution role values for step assignments
 *
 * USAGE:
 * executionRoleContract.parse('codeweaver');
 * // Returns: ExecutionRole branded enum value
 */

import { z } from 'zod';

export const executionRoleContract = z.enum([
  'chaoswhisperer',
  'glyphsmith',
  'pathseeker',
  'codeweaver',
  'ward',
  'spiritmender',
  'siegemaster',
  'lawbringer',
  'blightwarden',
]);

export type ExecutionRole = z.infer<typeof executionRoleContract>;
