/**
 * PURPOSE: Zod schema for validating Bash tool input structure
 *
 * USAGE:
 * const bashInput = bashToolInputContract.parse(input);
 * // Returns validated BashToolInput with command string
 */
import { z } from '#gateway/npm/zod';

export const bashToolInputContract = z.object({
  command: z.string().min(1).brand<'BashToolInputCommand'>(),
  timeout: z.number().int().positive().brand<'BashToolInputTimeout'>().optional(),
  run_in_background: z.boolean().optional(),
}).brand<'BashToolInput'>();

export type BashToolInput = z.infer<typeof bashToolInputContract>;
