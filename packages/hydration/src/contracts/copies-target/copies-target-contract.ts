/**
 * PURPOSE: Names the production code a `write` route imitates, so a diagnosis starts at the
 * counterpart instead of a hunt. Reach for this wherever an ingredient declares a `write` route
 * — Table 1 requires it there and nowhere else. Accepts a bare identifier naming in-repo production
 * code, or an `external:` pointer naming a producer this repo does not own.
 *
 * USAGE:
 * copiesTargetContract.parse('questPersistBroker');
 * // Returns a branded CopiesTarget
 *
 * copiesTargetContract.parse('external:claude-cli');
 * // Returns a branded CopiesTarget naming a producer outside this repo
 */
import { z } from 'zod';

export const copiesTargetContract = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    // `external:` exists because some ingredients imitate a producer this repo does not own (the
    // Claude CLI) — refusing every non-bare value would leave those ingredients nothing honest to
    // point at. The slash is refused unconditionally, in both forms: it is the exact shape that
    // put a test-harness file path (`claude-mock/bin/claude`) into `copies:` in the first place, so
    // the shape that caused the bug is the one this rejects.
    if (value.includes('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "copies: may not contain '/'. Use a bare identifier naming in-repo production code " +
          "(e.g. 'guildAddBroker'), or 'external:<name>' naming a producer outside the repo " +
          "(e.g. 'external:claude-cli').",
      });
      return;
    }
    if (value.startsWith('external:') && value.slice('external:'.length).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "copies: 'external:' must name a producer after the prefix. Use a bare identifier " +
          "naming in-repo production code (e.g. 'guildAddBroker'), or 'external:<name>' naming a " +
          "producer outside the repo (e.g. 'external:claude-cli').",
      });
    }
  })
  .brand<'CopiesTarget'>();

export type CopiesTarget = z.infer<typeof copiesTargetContract>;
