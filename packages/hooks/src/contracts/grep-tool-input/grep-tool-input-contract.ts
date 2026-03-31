/**
 * PURPOSE: Zod schema for Grep tool input fields used by the pre-search hook to determine allow/block
 *
 * USAGE:
 * const parsed = grepToolInputContract.safeParse(toolInput);
 * // Returns validated GrepToolInput with pattern, output_mode, context flags, etc.
 */
import { z } from 'zod';

export const grepToolInputContract = z.object({
  pattern: z.string().min(1).brand<'GrepPattern'>(),
  path: z.string().brand<'GrepPath'>().optional(),
  glob: z.string().brand<'GrepGlob'>().optional(),
  type: z.string().brand<'GrepType'>().optional(),
  output_mode: z.enum(['content', 'files_with_matches', 'count']).optional(),
  '-A': z.number().brand<'ContextLines'>().optional(),
  '-B': z.number().brand<'ContextLines'>().optional(),
  '-C': z.number().brand<'ContextLines'>().optional(),
  context: z.number().brand<'ContextLines'>().optional(),
  multiline: z.boolean().optional(),
  '-i': z.boolean().optional(),
  '-n': z.boolean().optional(),
  head_limit: z.number().brand<'HeadLimit'>().optional(),
  offset: z.number().brand<'Offset'>().optional(),
});

export type GrepToolInput = z.infer<typeof grepToolInputContract>;
