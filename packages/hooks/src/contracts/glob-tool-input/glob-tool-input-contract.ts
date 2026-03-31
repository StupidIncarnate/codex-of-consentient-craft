/**
 * PURPOSE: Zod schema for Glob tool input fields used by the pre-search hook to determine allow/block
 *
 * USAGE:
 * const parsed = globToolInputContract.safeParse(toolInput);
 * // Returns validated GlobToolInput with pattern and optional path
 */
import { z } from 'zod';

export const globToolInputContract = z.object({
  pattern: z.string().min(1).brand<'GlobPattern'>(),
  path: z.string().brand<'GlobPath'>().optional(),
});

export type GlobToolInput = z.infer<typeof globToolInputContract>;
