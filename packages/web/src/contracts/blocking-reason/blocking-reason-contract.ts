/**
 * PURPOSE: Defines a branded string type for step blocking reasons in the execution view
 *
 * USAGE:
 * blockingReasonContract.parse('Waiting for dependency step-1');
 * // Returns: BlockingReason branded string
 */

import { z } from 'zod';

export const blockingReasonContract = z.string().min(1).brand<'BlockingReason'>();

export type BlockingReason = z.infer<typeof blockingReasonContract>;
