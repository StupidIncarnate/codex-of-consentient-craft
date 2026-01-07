/**
 * PURPOSE: Defines the branded UUID type for Task identifiers
 *
 * USAGE:
 * taskIdContract.parse('f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c');
 * // Returns: TaskId branded string
 */

import { z } from 'zod';

export const taskIdContract = z.string().uuid().brand<'TaskId'>();

export type TaskId = z.infer<typeof taskIdContract>;
