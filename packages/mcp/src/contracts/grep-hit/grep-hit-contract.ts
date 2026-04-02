/**
 * PURPOSE: Defines schema for a single grep hit (line number + matched text)
 *
 * USAGE:
 * const hit: GrepHit = grepHitContract.parse({ line: 14, text: 'if (error.code === "ENOENT") {' });
 * // Returns validated grep hit with 1-based line number and matched text
 */
import { z } from 'zod';

export const grepHitContract = z.object({
  line: z.number().int().positive().brand<'LineNumber'>(),
  text: z.string().brand<'LineText'>(),
});

export type GrepHit = z.infer<typeof grepHitContract>;
