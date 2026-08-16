/**
 * PURPOSE: Branded UUID for one piece's identity within an operation plan
 *
 * USAGE:
 * operationPlanPieceIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: OperationPlanPieceId branded string
 *
 * WHEN-TO-USE: For piece ids in operationPlan.pieces[] and their dependsOn[] ordering refs
 * WHEN-NOT-TO-USE: For the plan's own id (use operationPlanIdContract) or the ledger item id (use operationItemIdContract)
 */

import { z } from 'zod';

export const operationPlanPieceIdContract = z.string().uuid().brand<'OperationPlanPieceId'>();

export type OperationPlanPieceId = z.infer<typeof operationPlanPieceIdContract>;
