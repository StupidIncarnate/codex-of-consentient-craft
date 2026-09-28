/**
 * PURPOSE: Answers the one question every request-body validation responder asks: the first issue
 * message a named top-level field carries on a failed parse, however deep inside that field the
 * issue actually occurred. Takes the caught value as `unknown` and matches its SHAPE through
 * `zodIssueErrorContract` rather than importing `ZodError` itself — only `contracts/` may import
 * `zod`, and this file lives in `transformers/`, which cannot.
 *
 * USAGE:
 * zodFirstFieldErrorMessageTransformer({ error: parsedBody.error, field: contentTextContract.parse('images') });
 * // Returns the first issue message whose path starts with `images`, or undefined when none does
 */
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { zodIssueErrorContract } from '../../contracts/zod-issue-error/zod-issue-error-contract';

export const zodFirstFieldErrorMessageTransformer = ({
  error,
  field,
}: {
  error: unknown;
  field: ContentText;
}): ContentText | undefined => {
  const parsedError = zodIssueErrorContract.parse(error);
  // `path[0]` is a ZodIssuePathSegment (string | number, its own brand) — a DIFFERENT brand than
  // `field`'s ContentText, so TS refuses the `===` as a no-overlap comparison between two disjoint
  // branded types even though both resolve to plain strings at runtime. String() strips both
  // brands down to the primitive the comparison actually means.
  const matchingIssue = parsedError.issues.find(
    (issue) => issue.path[0] !== undefined && String(issue.path[0]) === String(field),
  );

  return matchingIssue === undefined ? undefined : contentTextContract.parse(matchingIssue.message);
};
