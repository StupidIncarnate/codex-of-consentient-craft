/**
 * PURPOSE: Defines the lifecycle status of a quest work item
 *
 * USAGE:
 * workItemStatusContract.parse('pending');
 * // Returns: 'pending' as WorkItemStatus
 */

import { z } from 'zod';

export const workItemStatusContract = z.enum([
  'pending',
  'queued',
  'in_progress',
  'complete',
  'failed',
  'skipped',
]);

export type WorkItemStatus = z.infer<typeof workItemStatusContract>;
