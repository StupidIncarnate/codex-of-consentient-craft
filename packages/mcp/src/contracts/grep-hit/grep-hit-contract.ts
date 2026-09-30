/**
 * PURPOSE: Defines schema for a single grep hit (line number + matched text)
 *
 * USAGE:
 * const hit: GrepHit = grepHitContract.parse({ line: 14, text: 'if (error.code === "ENOENT") {' });
 * // Returns validated grep hit with 1-based line number and matched text
 */
import { z } from '#gateway/npm/zod';

export const grepHitContract = z
  .object({
    line: z.number().int().positive().brand<'GrepHitLine'>(),
    text: z.string().brand<'GrepHitText'>(),
  })
  .brand<'GrepHit'>();

export type GrepHit = z.infer<typeof grepHitContract>;
