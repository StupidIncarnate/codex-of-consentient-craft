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
  /** @deprecated Retained for forward-compat with quest.json files that still
   * reference the monolithic pathseeker role. New work items must use
   * `pathseeker-surface`, `pathseeker-dedup`, `pathseeker-assertion-correctness`,
   * or `pathseeker-walk`. */
  'pathseeker',
  'pathseeker-surface',
  'pathseeker-dedup',
  'pathseeker-assertion-correctness',
  'pathseeker-walk',
  'codeweaver',
  'ward',
  'spiritmender',
  'siegemaster',
  'lawbringer',
  'blightwarden',
]);

export type WorkItemRole = z.infer<typeof workItemRoleContract>;
