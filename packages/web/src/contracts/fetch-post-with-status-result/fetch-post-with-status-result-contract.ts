/**
 * PURPOSE: Validates the result of a status-aware POST fetch — exposes `status`, `ok`, and
 * the response `body` so callers can branch on HTTP status without losing the payload. Use
 * when a caller needs to treat 4xx/5xx differently rather than have the adapter throw.
 *
 * USAGE:
 * fetchPostWithStatusResultContract.parse({ status: 409, ok: false, body: { allowed: false } });
 * // Returns { status, ok, body } with `status` branded as HttpStatusCode.
 */

import { z } from 'zod';

import { httpStatusStatics } from '../../statics/http-status/http-status-statics';

export const fetchPostWithStatusResultContract = z.object({
  status: z
    .number()
    .int()
    .min(httpStatusStatics.range.min)
    .max(httpStatusStatics.range.max)
    .brand<'HttpStatusCode'>(),
  ok: z.boolean(),
  body: z.unknown(),
});

export type FetchPostWithStatusResult = z.infer<typeof fetchPostWithStatusResultContract>;
