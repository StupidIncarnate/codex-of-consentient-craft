/**
 * PURPOSE: The shape every route gets back from `dmHttpRequestAdapter` — a status code
 * alongside the parsed JSON body. Reach for this over letting a route read `unknown` fields
 * off the adapter's return directly: an `api` route's own test asserts the status code
 * (`toBe(201)`) as well as the body, and a bare `unknown` gives it nothing to narrow through.
 * A target's own `request` override must return this same shape — `dmTargetContract`'s own
 * test stubs one as `{ status: 201, body: {} }`.
 *
 * USAGE:
 * dmHttpResponseContract.parse({ status: 201, body: { id: 'f47ac10b-...' } });
 * // Returns { status: HttpStatusCode; body: unknown }
 */
import { z } from 'zod';

export const dmHttpResponseContract = z.object({
  status: z.number().int().brand<'HttpStatusCode'>(),
  body: z.unknown(),
});

export type DmHttpResponse = z.infer<typeof dmHttpResponseContract>;
