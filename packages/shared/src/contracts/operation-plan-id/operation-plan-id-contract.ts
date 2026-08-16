/**
 * PURPOSE: Branded UUID for one operation plan's identity on a quest work item
 *
 * USAGE:
 * operationPlanIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: OperationPlanId branded string
 *
 * WHEN-TO-USE: For plan ids in quest.planningNotes.operationPlans[], read back by the orchestrator
 * session that dispatched the planner sub-agent which wrote the plan
 * WHEN-NOT-TO-USE: For the pieces within a plan (use operationPlanPieceIdContract) or the ledger
 * item id the plan was produced for (use operationItemIdContract)
 */

import { z } from 'zod';

export const operationPlanIdContract = z.string().uuid().brand<'OperationPlanId'>();

export type OperationPlanId = z.infer<typeof operationPlanIdContract>;
