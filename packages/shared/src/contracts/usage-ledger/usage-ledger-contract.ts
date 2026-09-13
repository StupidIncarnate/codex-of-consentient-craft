/**
 * PURPOSE: Everything dungeonmaster persists about its own quota spend — the hourly buckets it
 *   summed out of Claude's transcripts, where it had read up to in each file, and the ceilings it
 *   has observed. This is the file that makes the guardrail survive a machine with no statusline
 *   and no open session: the measurement is taken from transcripts on disk, so it is complete
 *   whether or not anyone was watching.
 *
 * USAGE:
 * usageLedgerContract.parse({ buckets: {}, cursors: {}, ceilings: {}, updatedAt: iso });
 * // Returns: UsageLedger
 */

import { z } from 'zod';

import { usageBucketContract } from '../usage-bucket/usage-bucket-contract';
import { weightedTokensContract } from '../weighted-tokens/weighted-tokens-contract';

export const usageLedgerContract = z.object({
  // Keyed by the bucket's start time in epoch MILLISECONDS, as a string because JSON object keys
  // are strings. Buckets older than the seven-day window are dropped on every write.
  buckets: z.record(usageBucketContract),
  // One entry per transcript file already counted, keyed by absolute path. A file is re-read only
  // when its size or mtime moved, which is what keeps a 600 MB tree to a few MB of reads per scan.
  cursors: z.record(
    z.object({
      mtimeMs: z.number().min(0).brand<'EpochMs'>(),
      size: z.number().int().min(0).brand<'ByteSize'>(),
    }),
  ),
  // Learned, never configured. A 429 names the window it refused, and the weighted total standing
  // at that moment IS that window's ceiling — so the percentage has a real denominator without the
  // user being asked for a number nobody publishes. Null until a refusal has been seen for that
  // window, and a null OR zero ceiling raises no percentage hold at all: an uncalibrated guess
  // would stop the queue on a number that means nothing, and zero would make every reading
  // infinite.
  ceilings: z.object({
    fiveHour: weightedTokensContract.nullable(),
    sevenDay: weightedTokensContract.nullable(),
  }),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type UsageLedger = z.infer<typeof usageLedgerContract>;
