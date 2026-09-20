/**
 * PURPOSE: What `HydrationRouteFailedError` needs off whatever a route actually threw — the URL,
 * the status and the response body, each nullable because a refused CONNECTION never reaches a
 * status at all. Reach for this over three loose parameters at every mid-run catch site: one shape
 * both `routeFailureTransformer`'s output and the error's constructor input share.
 *
 * USAGE:
 * routeFailureContract.parse({ url: null, status: null, responseBody: null });
 * // Returns a RouteFailure — the refused-connection shape
 */
import { z } from 'zod';

// The protocol's own bounds, not a value that grows.
const HTTP_STATUS_MIN = 100;
const HTTP_STATUS_MAX = 599;

// Re-derives the 'Url', 'HttpStatus' and 'ResponseBody' brands `hydration-target-contract.ts` and
// `http-response-contract.ts` each keep private (one exported schema per contract file) — the
// literal brand argument, not an import, is what makes these structurally identical.
const urlLikeContract = z.string().url().brand<'Url'>();
const httpStatusContract = z
  .number()
  .int()
  .min(HTTP_STATUS_MIN)
  .max(HTTP_STATUS_MAX)
  .brand<'HttpStatus'>();
const responseBodyContract = z.string().brand<'ResponseBody'>();

export const routeFailureContract = z.object({
  url: urlLikeContract.nullable(),
  status: httpStatusContract.nullable(),
  responseBody: responseBodyContract.nullable(),
});

export type RouteFailure = z.infer<typeof routeFailureContract>;
