/**
 * PURPOSE: What `dungeonmaster siegelense cleanup`'s argv parses into — `human` is the ONLY field,
 * because `cleanup` takes no other input (siegelense-tooling.md line 2409): it names which of the
 * two renderers (`cleanupAnswerRenderTransformer` or the JSON default) the responder reaches for.
 * Reach for this over `z.object({})` directly: a bare empty object gives a reader nothing to name
 * when the parser rejects every other flag.
 *
 * USAGE:
 * cleanupArgsContract.parse({ human: false });
 * // Returns a validated CleanupArgs
 */

import { z } from 'zod';

export const cleanupArgsContract = z
  .object({
    human: z.boolean(),
  })
  .strict();

export type CleanupArgs = z.infer<typeof cleanupArgsContract>;
