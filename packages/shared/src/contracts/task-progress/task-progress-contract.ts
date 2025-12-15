/**
 * PURPOSE: Defines a task progress string like "2/5"
 *
 * USAGE:
 * taskProgressContract.parse('2/5');
 * // Returns: '2/5' as TaskProgress branded type
 */

import { z } from 'zod';

export const taskProgressContract = z.string().brand<'TaskProgress'>();

export type TaskProgress = z.infer<typeof taskProgressContract>;
