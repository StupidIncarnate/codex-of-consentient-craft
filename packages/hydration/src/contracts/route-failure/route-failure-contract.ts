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
import { z } from '#gateway/npm/zod';

// The protocol's own bounds, not a value that grows.
const HTTP_STATUS_MIN = 100;
const HTTP_STATUS_MAX = 599;

export const routeFailureContract = z
  .object({
    url: z.url().brand<'RouteFailureUrl'>().nullable(),
    status: z
      .number()
      .int()
      .min(HTTP_STATUS_MIN)
      .max(HTTP_STATUS_MAX)
      .brand<'RouteFailureStatus'>()
      .nullable(),
    responseBody: z.string().brand<'RouteFailureResponseBody'>().nullable(),
  })
  .brand<'RouteFailure'>();

export type RouteFailure = z.infer<typeof routeFailureContract>;
