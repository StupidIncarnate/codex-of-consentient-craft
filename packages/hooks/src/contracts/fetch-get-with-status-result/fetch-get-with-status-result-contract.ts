/**
 * PURPOSE: Validates the result of a status-aware GET fetch — exposes `status`, `ok`, and
 * the response `body` so callers can branch on HTTP status without losing the payload. Use
 * when a caller needs to treat 4xx/5xx differently rather than have the adapter throw.
 *
 * USAGE:
 * fetchGetWithStatusResultContract.parse({ status: 404, ok: false, body: { error: 'No quest' } });
 * // Returns { status, ok, body } with `status` branded as HttpStatusCode.
 */

import { z } from 'zod';

import { httpStatusStatics } from '../../statics/http-status/http-status-statics';

export const fetchGetWithStatusResultContract = z.object({
  status: z
    .number()
    .int()
    .min(httpStatusStatics.range.min)
    .max(httpStatusStatics.range.max)
    .brand<'HttpStatusCode'>(),
  ok: z.boolean(),
  body: z.unknown(),
});

export type FetchGetWithStatusResult = z.infer<typeof fetchGetWithStatusResultContract>;
