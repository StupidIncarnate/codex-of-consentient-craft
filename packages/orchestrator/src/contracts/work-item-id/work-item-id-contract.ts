/**
 * PURPOSE: Defines a branded string type for work item identifiers used by WorkTracker
 *
 * USAGE:
 * workItemIdContract.parse('work-item-0');
 * // Returns branded WorkItemId
 */

import { z } from 'zod';

export const workItemIdContract = z.string().min(1).brand<'WorkItemId'>();

export type WorkItemId = z.infer<typeof workItemIdContract>;
