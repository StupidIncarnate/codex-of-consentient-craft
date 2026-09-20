/**
 * PURPOSE: A memory or disk quantity in whole megabytes — `freeMemMB`, `totalMemMB`, `freeDiskMB`,
 * `rssMB`, `rssAtLastBeat` all share this one brand rather than four uncoordinated numbers. Reach
 * for this over `ReadingCount` whenever the value is a measured quantity of memory rather than a
 * tally of events, and over a raw number so `machineReadingContract` and `instanceStatusContract`
 * cannot silently drift onto different units.
 *
 * USAGE:
 * megabytesContract.parse(1840);
 * // Returns a branded Megabytes
 */

import { z } from 'zod';

export const megabytesContract = z.number().int().nonnegative().brand<'Megabytes'>();

export type Megabytes = z.infer<typeof megabytesContract>;
