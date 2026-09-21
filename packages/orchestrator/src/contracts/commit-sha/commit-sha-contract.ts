/**
 * PURPOSE: Names ONE commit on a quest branch, as `git log` prints it. Reach for this over
 * `questContract.shape.baseRef` — which is also a sha-shaped branded string — when the value is a
 * commit this quest's own branch PRODUCED rather than the pinned base the whole branch is measured
 * from: the two are different facts about different points in history, and a shared brand would let
 * a caller hand one where the other belongs without the compiler saying so.
 *
 * USAGE:
 * commitShaContract.parse('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0');
 * // Returns: CommitSha
 *
 * Hex, 7 to 40 characters — `git log --format=%H` prints 40 and `%h` prints an abbreviation whose
 * length git chooses per repo, so pinning either end would refuse a real reading.
 */

import { z } from 'zod';

export const commitShaContract = z
  .string()
  .regex(/^[0-9a-f]{7,40}$/u)
  .brand<'CommitSha'>();

export type CommitSha = z.infer<typeof commitShaContract>;
