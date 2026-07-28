/**
 * PURPOSE: Defines the display label the operations ledger prints for one of an item's flows
 *
 * USAGE:
 * operationFlowLabelContract.parse('Send queued comment batch');
 * // Returns: OperationFlowLabel branded string
 */

import { z } from 'zod';

export const operationFlowLabelContract = z.string().min(1).brand<'OperationFlowLabel'>();

export type OperationFlowLabel = z.infer<typeof operationFlowLabelContract>;
