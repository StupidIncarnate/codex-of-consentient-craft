/**
 * PURPOSE: The shape a thrown ZodError actually carries — an `issues` array, each with a `path` and
 * a `message`, plus the `code`, `received` and `options` an enum refusal carries — matched WITHOUT importing `ZodError` itself: only `contracts/` may import `zod`, and
 * `flagContractParseTransformer`, the file that needs this check, lives in `transformers/`, which
 * cannot. Parsing an unknown caught value through this contract is what makes "was this thrown by a
 * branded contract's own `.parse()`" answerable from a layer that can never write `instanceof
 * ZodError`. A caught value that fails this parse is not a validation failure and the caller must
 * rethrow it exactly as caught, never reshaped.
 *
 * USAGE:
 * zodIssueErrorContract.safeParse(caughtValue);
 * // { success: true, data: { issues: [{ message, path }, ...] } } when caughtValue is a ZodError
 * // { success: false, ... } for anything else thrown
 */

import { z } from 'zod';

const zodIssuePathSegmentContract = z.union([
  z.string().brand<'ZodIssuePathSegment'>(),
  z.number().brand<'ZodIssuePathSegment'>(),
]);

const zodIssueEnumValueContract = z.union([
  z.string().brand<'ZodIssueEnumValue'>(),
  z.number().brand<'ZodIssueEnumValue'>(),
]);

export const zodIssueErrorContract = z.object({
  issues: z
    .array(
      z.object({
        message: z.string().min(1).brand<'ZodIssueMessage'>(),
        path: z.array(zodIssuePathSegmentContract),
        // Only an `invalid_enum_value` issue carries these two: what the caller typed, and the
        // members it could have typed instead.
        code: z.string().brand<'ZodIssueCode'>().optional(),
        received: zodIssueEnumValueContract.optional(),
        options: z.array(zodIssueEnumValueContract).optional(),
      }),
    )
    .min(1),
});

export type ZodIssueError = z.infer<typeof zodIssueErrorContract>;
