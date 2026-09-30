/**
 * PURPOSE: Defines one described call — the arguments expected, what that call gets back, and whether it is one-shot
 *
 * USAGE:
 * const record: StagedCall = { args: ['/a/quest.json'], impl: () => questJson, once: false, consumed: false };
 * // Describes a call to the mocked function and the answer it receives
 */

import { z } from '#gateway/npm/zod';

// `impl` is a function — zod validates only the data fields; `.loose()` carries `impl`
// through `.parse()` unvalidated, since a Zod object schema cannot check callability.
export const stagedCallContract = z
  .object({
    args: z.array(z.unknown()).readonly(),
    once: z.boolean(),
    consumed: z.boolean(),
  })
  .loose().brand<'StagedCall'>();

export type StagedCall = z.infer<typeof stagedCallContract> & {
  impl: (...args: unknown[]) => unknown;
};
