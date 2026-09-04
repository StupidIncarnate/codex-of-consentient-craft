/**
 * PURPOSE: Names the four forensic views `DigestRunResponder` can render for a target. Reach for
 * this over a bare string so an unrecognized CLI command argument fails at the input boundary
 * instead of falling silently through the responder's command-to-transformer selection.
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
