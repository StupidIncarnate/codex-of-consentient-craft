/**
 * PURPOSE: Validates the result of a status-aware fetch — exposes `status`, `ok`, and the
 * response `body` so callers can branch on HTTP status without losing the payload. Reach for
 * this over a throwing fetch adapter whenever the caller must treat 4xx/5xx (or a value like
 * "server unreachable" vs "server answered with an error") as data rather than an exception.
 * Shared by every method-specific fetch-with-status adapter — POST and GET alike — since the
 * shape carries nothing method-specific.
 *
 * USAGE:
 * fetchWithStatusResultContract.parse({ status: 409, ok: false, body: { allowed: false } });
 * // Returns { status, ok, body } with `status` branded as HttpStatusCode.
 */

import { z } from 'zod';

import { httpStatusStatics } from '../../statics/http-status/http-status-statics';

export const fetchWithStatusResultContract = z.object({
  status: z
    .number()
    .int()
    .min(httpStatusStatics.range.min)
    .max(httpStatusStatics.range.max)
    .brand<'HttpStatusCode'>(),
  ok: z.boolean(),
  body: z.unknown(),
});

export type FetchWithStatusResult = z.infer<typeof fetchWithStatusResultContract>;
