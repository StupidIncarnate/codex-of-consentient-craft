/**
 * PURPOSE: What `dungeonmaster siegelense cleanup`'s argv parses into — `isJson` is the ONLY field,
 * because `cleanup` takes no other input (siegelense-tooling.md line 2409): human-readable output
 * is the default, and `--json` selects the raw JSON output.
 * Reach for this over `z.object({})` directly: a bare empty object gives a reader nothing to name
 * when the parser rejects every other flag.
 *
 * USAGE:
 * cleanupArgsContract.parse({ isJson: false });
 * // Returns a validated CleanupArgs
 */

import { z } from 'zod';

export const cleanupArgsContract = z
  .object({
    isJson: z.boolean(),
  })
  .strict();

export type CleanupArgs = z.infer<typeof cleanupArgsContract>;
