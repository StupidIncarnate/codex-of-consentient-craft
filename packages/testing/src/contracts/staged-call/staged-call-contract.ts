/**
 * PURPOSE: Defines one described call — the arguments expected, what that call gets back, and whether it is one-shot
 *
 * USAGE:
 * const record: StagedCall = { args: ['/a/quest.json'], impl: () => questJson, once: false, consumed: false };
 * // Describes a call to the mocked function and the answer it receives
 */

import { z } from 'zod';

export const stagedCallContract = z.object({
  args: z.array(z.unknown()).readonly(),
  impl: z.function(),
  once: z.boolean(),
  consumed: z.boolean(),
});

export type StagedCall = z.infer<typeof stagedCallContract>;
