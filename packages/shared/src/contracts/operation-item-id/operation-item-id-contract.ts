/**
 * PURPOSE: Branded UUID for operation-item identity on the quest operations ledger
 *
 * USAGE:
 * operationItemIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: OperationItemId branded string
 *
 * WHEN-TO-USE: For operation item IDs in quest.operations[] and operations/<id> relatedDataItems refs
 * WHEN-NOT-TO-USE: For work item IDs (use questWorkItemIdContract)
 */

import { z } from 'zod';

export const operationItemIdContract = z.string().uuid().brand<'OperationItemId'>();

export type OperationItemId = z.infer<typeof operationItemIdContract>;
