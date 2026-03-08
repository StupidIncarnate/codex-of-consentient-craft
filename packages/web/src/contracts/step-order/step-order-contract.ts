/**
 * PURPOSE: Defines a branded non-negative integer type for execution step order numbers
 *
 * USAGE:
 * stepOrderContract.parse(1);
 * // Returns: StepOrder branded number
 */

import { z } from 'zod';

export const stepOrderContract = z.number().int().nonnegative().brand<'StepOrder'>();

export type StepOrder = z.infer<typeof stepOrderContract>;
