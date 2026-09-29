/**
 * PURPOSE: The shape a thrown ZodError actually carries — an `issues` array, each with a `path` and
 * a `message` — matched WITHOUT importing `ZodError` itself: only `contracts/` may import `zod`, and
 * `zodFirstFieldErrorMessageTransformer`, the file that needs this check, lives in `transformers/`,
 * which cannot. Parsing a `safeParse` failure's `error` through this contract is what makes its
 * `issues` readable from a layer that can never import `zod`'s own type.
 *
 * USAGE:
 * zodIssueErrorContract.parse(parsedBody.error);
 * // { issues: [{ message, path }, ...] } when parsedBody.error is a real ZodError
 */

import { z } from '#gateway/npm/zod';

const zodIssuePathSegmentContract = z.union([
  z.string().brand<'ZodIssuePathSegment'>(),
  z.number().brand<'ZodIssuePathSegment'>(),
]);

export const zodIssueErrorContract = z.object({
  issues: z
    .array(
      z.object({
        message: z.string().min(1).brand<'ZodIssueMessage'>(),
        path: z.array(zodIssuePathSegmentContract),
      }),
    )
    .min(1),
});

export type ZodIssueError = z.infer<typeof zodIssueErrorContract>;
