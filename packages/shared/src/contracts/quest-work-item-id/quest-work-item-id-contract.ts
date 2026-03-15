/**
 * PURPOSE: Branded UUID for quest-level work item identity
 *
 * USAGE:
 * questWorkItemIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: QuestWorkItemId branded string
 *
 * WHEN-TO-USE: For work item IDs in quest.workItems[], dependsOn[], insertedBy
 * WHEN-NOT-TO-USE: For slot manager internal WorkItemId (sequential strings)
 */

import { z } from 'zod';

export const questWorkItemIdContract = z.string().uuid().brand<'QuestWorkItemId'>();

export type QuestWorkItemId = z.infer<typeof questWorkItemIdContract>;
