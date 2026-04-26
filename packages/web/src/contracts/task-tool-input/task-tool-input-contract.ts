/**
 * PURPOSE: Defines the shape of a Task tool_use entry's toolInput JSON for sub-agent task description extraction
 *
 * USAGE:
 * taskToolInputContract.safeParse(JSON.parse(entry.toolInput));
 * // Returns { success: true, data: { description: 'Run tests' } } when valid
 */

import { z } from 'zod';

export const taskToolInputContract = z
  .object({
    description: z.string().brand<'ChainDescription'>(),
  })
  .passthrough();

export type TaskToolInput = z.infer<typeof taskToolInputContract>;
