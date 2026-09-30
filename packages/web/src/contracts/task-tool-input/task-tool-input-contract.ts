/**
 * PURPOSE: Defines the shape of a Task tool_use entry's toolInput JSON for sub-agent task description extraction
 *
 * USAGE:
 * taskToolInputContract.safeParse(JSON.parse(entry.toolInput));
 * // Returns { success: true, data: { description: 'Run tests' } } when valid
 */

import { z } from '#gateway/npm/zod';

export const taskToolInputContract = z
  .object({
    description: z.string().brand<'TaskToolInputDescription'>(),
  })
  .loose().brand<'TaskToolInput'>();

export type TaskToolInput = z.infer<typeof taskToolInputContract>;
