/**
 * PURPOSE: Defines a branded string type for execution step names
 *
 * USAGE:
 * stepNameContract.parse('Build user auth flow');
 * // Returns: StepName branded string
 */

import { z } from 'zod';

export const stepNameContract = z.string().min(1).brand<'StepName'>();

export type StepName = z.infer<typeof stepNameContract>;
