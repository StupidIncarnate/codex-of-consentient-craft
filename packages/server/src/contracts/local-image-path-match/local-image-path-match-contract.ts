/**
 * PURPOSE: One local image path found in a chat message, paired with the ordinal it earned in the
 * scan's text order. Reach for this over passing a path and a number separately — the pairing is
 * what lets the copy and token-rewrite steps downstream key a file back to the exact text run it
 * replaces.
 *
 * `path` is the name the FILESYSTEM answers to; `matchedText` is the run of characters the message
 * actually spent on it. The two differ whenever the writer quoted the path or backslash-escaped its
 * spaces, and both are needed: the copy step opens `path`, and the rewrite step replaces
 * `matchedText`, so a quoted path loses its quotes to the token instead of keeping them around it.
 *
 * USAGE:
 * localImagePathMatchContract.parse({
 *   path: '/home/user/pasted.png',
 *   matchedText: '/home/user/pasted.png',
 *   ordinal: 1,
 * });
 * // Returns branded LocalImagePathMatch
 */

import { z } from '#gateway/npm/zod';

export const localImagePathMatchContract = z
  .object({
    path: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'LocalImagePathMatchPath'>(),
    matchedText: z.string().min(1).brand<'LocalImagePathMatchMatchedText'>(),
    ordinal: z.number().int().positive().brand<'LocalImagePathMatchOrdinal'>(),
  })
  .brand<'LocalImagePathMatch'>();

export type LocalImagePathMatch = z.infer<typeof localImagePathMatchContract>;
