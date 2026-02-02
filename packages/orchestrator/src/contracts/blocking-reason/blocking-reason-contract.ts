/**
 * PURPOSE: Defines a branded string type for step blocking reasons
 *
 * USAGE:
 * blockingReasonContract.parse('User input needed');
 * // Returns: BlockingReason branded string
 */

import { z } from 'zod';

export const blockingReasonContract = z.string().brand<'BlockingReason'>();

export type BlockingReason = z.infer<typeof blockingReasonContract>;
