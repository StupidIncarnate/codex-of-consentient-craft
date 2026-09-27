/**
 * PURPOSE: A key into `usageLedgerContract`'s `buckets` record — an hourly bucket's start time in
 * epoch MILLISECONDS, carried as a string because JSON object keys are strings. A caller deriving a
 * key from a number (e.g. `String(sample.bucketStartMs)`) re-parses it through this contract to
 * index or write the branded `Record` that field returns.
 *
 * USAGE:
 * bucketStartKeyContract.parse(String(1700000000000));
 * // Returns a branded BucketStartKey
 */

import { z } from 'zod';

export const bucketStartKeyContract = z.string().brand<'BucketStartKey'>();

export type BucketStartKey = z.infer<typeof bucketStartKeyContract>;
