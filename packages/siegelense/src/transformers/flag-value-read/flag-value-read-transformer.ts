/**
 * PURPOSE: Reads the value that follows one named flag inside a subcommand's argv — `null` when the
 * flag is absent, and a throw when the flag's value is missing, itself looks like another flag, or the
 * flag was named more than once. Every siegelense arg parser (`kill`, `status`, `cleanup`, `start`,
 * `compare`, `run`, `results`) reaches for this instead of re-deriving the same `args.indexOf` dance
 * `siegelense-flow.ts` and `cli-siegelense-responder.ts` each still carry their own copy of, so the one
 * refusal sentence lives in one place rather than drifting between two.
 *
 * USAGE:
 * flagValueReadTransformer({ args: ['--instance', 'inst_7f3a9c21'], flag: '--instance' });
 * // Returns 'inst_7f3a9c21' as ContentText
 * flagValueReadTransformer({ args: [], flag: '--instance' });
 * // Returns null — the flag was never named
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

export const flagValueReadTransformer = ({
  args,
  flag,
}: {
  args: readonly string[];
  flag: string;
}): ContentText | null => {
  const occurrenceCount = args.filter((arg) => arg === flag).length;

  if (occurrenceCount === 0) {
    return null;
  }

  if (occurrenceCount > 1) {
    throw new Error(
      `${flag} was given twice: a repeated flag is ambiguous, and this refuses rather than ` +
        `silently choosing the first or the last value.`,
    );
  }

  const flagIndex = args.indexOf(flag);
  const value = args[flagIndex + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(
      `${flag} is required: it cannot be missing, and the value cannot itself start with "--".`,
    );
  }

  return contentTextContract.parse(value);
};
