/**
 * PURPOSE: Zod schema for validating Bash tool input structure
 *
 * USAGE:
 * const bashInput = bashToolInputContract.parse(input);
 * // Returns validated BashToolInput with command string
 */
import { z } from 'zod';

export const bashToolInputContract = z.object({
  command: z.string().min(1).brand<'BashCommand'>(),
  timeout: z.number().int().positive().brand<'BashTimeout'>().optional(),
});

export type BashToolInput = z.infer<typeof bashToolInputContract>;
