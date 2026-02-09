/**
 * PURPOSE: Defines a branded string type for step names in quest execution
 *
 * USAGE:
 * stepNameContract.parse('implement-auth-middleware');
 * // Returns: StepName branded string
 */

import { z } from 'zod';

export const stepNameContract = z.string().brand<'StepName'>();

export type StepName = z.infer<typeof stepNameContract>;
