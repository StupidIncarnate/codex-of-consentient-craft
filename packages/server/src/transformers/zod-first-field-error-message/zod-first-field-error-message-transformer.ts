/**
 * PURPOSE: Answers the one question every request-body validation responder asks: the first issue
 * message a named top-level field carries on a failed parse, however deep inside that field the
 * issue actually occurred.
 *
 * USAGE:
 * zodFirstFieldErrorMessageTransformer({ error: parsedBody.error, field: contentTextContract.parse('images') });
 * // Returns the first issue message whose path starts with `images`, or undefined when none does
 */
import type { z } from '#gateway/npm/zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

export const zodFirstFieldErrorMessageTransformer = ({
  error,
  field,
}: {
  error: z.ZodError;
  field: ContentText;
}): ContentText | undefined => {
  // `path[0]` is a PropertyKey and `field` a branded ContentText, so TS refuses `===` between them;
  // String() strips both down to the primitive the comparison actually means.
  const matchingIssue = error.issues.find(
    (issue) => issue.path[0] !== undefined && String(issue.path[0]) === String(field),
  );

  return matchingIssue === undefined ? undefined : contentTextContract.parse(matchingIssue.message);
};
