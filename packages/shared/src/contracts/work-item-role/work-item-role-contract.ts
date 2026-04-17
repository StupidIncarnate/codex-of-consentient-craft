/**
 * PURPOSE: Defines which agent role or command type executes a work item
 *
 * USAGE:
 * workItemRoleContract.parse('codeweaver');
 * // Returns: 'codeweaver' as WorkItemRole
 */

import { z } from 'zod';

export const workItemRoleContract = z.enum([
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

export type WorkItemRole = z.infer<typeof workItemRoleContract>;
