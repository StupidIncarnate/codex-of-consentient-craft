/**
 * PURPOSE: The `console` condition an `until` step waits on — a regex SOURCE string matched against
 * a console line's own `text` field, compiled with `new RegExp(source, 'u')`. A batch reaches the
 * tool as JSON, which carries no regex literal, so this field is the UNWRAPPED pattern rather than
 * the spec's own `/hydrated/` notation — a value wrapped in slashes is refused BY NAME, naming the
 * unwrapped form to type instead of failing the wait for an unreadable reason later.
 *
 * USAGE:
 * untilConsolePatternContract.parse('hydrated');
 * // Returns a branded UntilConsolePattern
 */

import { z } from 'zod';

// A candidate needs a leading AND a trailing slash to read as slash-wrapped, so anything shorter
// than two characters cannot be — a bare "/" is a legitimate pattern matching a literal slash.
const MIN_SLASH_WRAPPED_LENGTH = 2;

export const untilConsolePatternContract = z
  .string()
  .min(1)
  .refine(
    (candidate) =>
      !(
        candidate.length >= MIN_SLASH_WRAPPED_LENGTH &&
        candidate.startsWith('/') &&
        candidate.endsWith('/')
      ),
    {
      message:
        'a console pattern is a regex SOURCE string, not a regex literal — JSON carries no /pattern/ syntax. Drop the surrounding slashes: { "step": "until", "console": "hydrated" }',
    },
  )
  .refine(
    (candidate) => {
      // `RegExp.prototype.source` re-escapes a literal "/" back to "\/" (so the value stays safe
      // inside a `/pattern/` literal), so it is never compared against `candidate` here — only
      // whether the construction throws is the question this refine asks.
      try {
        const compiled = new RegExp(candidate, 'u');
        return typeof compiled.source === 'string';
      } catch {
        return false;
      }
    },
    { message: 'a console pattern must be a compilable regular expression source' },
  )
  .brand<'UntilConsolePattern'>();

export type UntilConsolePattern = z.infer<typeof untilConsolePatternContract>;
