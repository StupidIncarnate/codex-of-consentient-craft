/**
 * PURPOSE: Answers the one question every request-body validation responder asks: the first issue
 * message a named top-level field carries on a failed parse, however deep inside that field the
 * issue actually occurred. Replaces the deprecated `.flatten().fieldErrors[field]?.[0]` idiom —
 * `error.issues` groups the same way `.flatten()` did (by `path[0]`), without the deprecation.
 *
 * USAGE:
 * zodFirstFieldErrorMessageAdapter({ error: parsedBody.error, field: contentTextContract.parse('images') });
 * // Returns the first issue message whose path starts with `images`, or undefined when none does
 */
import type { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

export const zodFirstFieldErrorMessageAdapter = ({
  error,
  field,
}: {
  error: z.ZodError<Record<string, unknown>>;
  field: ContentText;
}): ContentText | undefined => {
  const matchingIssue = error.issues.find((issue) => issue.path[0] === field);

  return matchingIssue === undefined ? undefined : contentTextContract.parse(matchingIssue.message);
};
