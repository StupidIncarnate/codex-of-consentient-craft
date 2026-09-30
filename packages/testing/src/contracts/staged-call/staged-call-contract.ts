/**
 * PURPOSE: Defines one described call — the arguments expected, what that call gets back, and whether it is one-shot
 *
 * USAGE:
 * const record: StagedCall = { args: ['/a/quest.json'], impl: () => questJson, once: false, consumed: false };
 * // Describes a call to the mocked function and the answer it receives
 */

import { z } from '#gateway/npm/zod';

// `args` (matchers: strings, regexes, functions) and `impl` are not JSON — zod validates only the
// data fields; `.loose()` carries `args` and `impl` through `.parse()` unvalidated, and the
// TypeScript intersection below types them.
export const stagedCallContract = z
  .object({
    once: z.boolean(),
    consumed: z.boolean(),
  })
  .loose()
  .brand<'StagedCall'>();

export type StagedCall = z.infer<typeof stagedCallContract> & {
  args: readonly unknown[];
  impl: (...args: unknown[]) => unknown;
};
