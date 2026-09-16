/**
 * PURPOSE: A nonnegative tally in a run's index — console errors, warnings, server errors, network
 * exchanges, non-2xx responses — counted from the buffer's recorded window, never reset
 * (chunk-02-driver-and-batch.md §2, "a run records its WINDOW, and its index counts only that
 * window"). Reach for this over ArrayIndex (`@dungeonmaster/shared/contracts`): ArrayIndex names the
 * position of an element already sitting in a collection, while a ReadingCount is a running total
 * that never indexes into anything — a run with zero console errors has no array to be zero-length,
 * only a count that is zero.
 *
 * USAGE:
 * readingCountContract.parse(0);
 * // Returns a branded ReadingCount
 */

import { z } from 'zod';

export const readingCountContract = z.number().int().nonnegative().brand<'ReadingCount'>();

export type ReadingCount = z.infer<typeof readingCountContract>;
