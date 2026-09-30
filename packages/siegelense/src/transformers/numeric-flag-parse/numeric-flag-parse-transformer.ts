/**
 * PURPOSE: Turns a numeric flag's raw string into the value its contract accepts, and on a refusal
 * answers under the flag's own name with `accepts` and the exact text the caller typed — never the
 * contract's own message, which describes what `Number(raw)` became (`Expected number, received nan`
 * for `"abc"`, a bound with no mention of the flag at all) rather than what the caller can fix.
 * Reach for this at any site that turns a flag's text value into a number before a branded numeric
 * contract checks it, in place of `flagContractParseTransformer` alone: that file only cleans up a
 * contract's OWN issue text, and by the time a contract sees the value, `Number()` has already thrown
 * the raw string away.
 *
 * USAGE:
 * numericFlagParseTransformer({
 *   flag: '--pool',
 *   raw: rawPoolSize,
 *   accepts: 'a whole number of 1 or more',
 *   parse: (value) => profilePoolSizeContract.parse(value),
 * });
 * // Throws Error('--pool must be a whole number of 1 or more; got "abc"') when raw is 'abc'
 */


import { z } from '#gateway/npm/zod';

export const numericFlagParseTransformer = <T>({
  flag,
  raw,
  accepts,
  parse,
}: {
  flag: string;
  raw: string;
  accepts: string;
  parse: (value: number) => T;
}): T => {
  try {
    return parse(Number(raw));
  } catch (error) {
    if (!(error instanceof z.ZodError)) {
      throw error;
    }

    throw new Error(`${flag} must be ${accepts}; got "${raw}"`, { cause: error });
  }
};
