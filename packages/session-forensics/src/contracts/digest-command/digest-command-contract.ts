/**
 * PURPOSE: Names the four forensic views `DigestRunResponder` can render for a target. A bare
 * string would let a bad CLI command argument slip through unnoticed. This contract catches that
 * at the input boundary instead, before the responder tries to match the command to a transformer.
 *
 * USAGE:
 * digestCommandContract.parse('summary');
 * // Returns: 'summary' as DigestCommand
 */
import { z } from 'zod';

export const digestCommandContract = z
  .enum(['summary', 'buckets', 'gaps', 'coverage'])
  .brand<'DigestCommand'>();

export type DigestCommand = z.infer<typeof digestCommandContract>;
