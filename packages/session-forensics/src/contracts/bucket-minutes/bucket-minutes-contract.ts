/**
 * PURPOSE: Validates the `--minutes` CLI flag on the `buckets` command — a raw argv string, never
 * trusted until parsed here. `z.coerce.number()` turns the string into a number before `.int()` and
 * `.positive()` reject anything that is not a whole window width above zero, so a typo like
 * `--minutes abc` or `--minutes -5` fails at the boundary instead of silently falling through to
 * `recordsToBucketsTransformer`'s own default.
 *
 * USAGE:
 * bucketMinutesContract.parse('5');
 * // Returns: 5 as BucketMinutes
 */
import { z } from 'zod';

export const bucketMinutesContract = z.coerce.number().int().positive().brand<'BucketMinutes'>();

export type BucketMinutes = z.infer<typeof bucketMinutesContract>;
