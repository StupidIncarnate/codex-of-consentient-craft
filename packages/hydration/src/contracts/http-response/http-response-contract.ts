/**
 * PURPOSE: What an `api` route's call actually came back with, before anything decides whether it
 * is a record. Reach for this over the raw fetch `Response` object: that carries a consumed body
 * stream and a header map, neither of which a `toStrictEqual` assertion can compare, and
 * `fetchPostAdapter` reduces to exactly this shape before handing anything back.
 *
 * USAGE:
 * httpResponseContract.parse({ url: 'http://localhost:3737/api/guilds', status: 201, body: '{"id":"g1"}' });
 * // Returns an HttpResponse
 */
import { z } from 'zod';

// The protocol's own bounds, not a value that grows — the smallest and largest status codes HTTP
// itself defines.
const HTTP_STATUS_MIN = 100;
const HTTP_STATUS_MAX = 599;

// Re-derives the 'Url' brand `hydration-target-contract.ts` keeps private (one exported schema per
// contract file) — the literal brand argument, not an import, is what makes the two structurally
// identical, so a value parsed here is assignable wherever that file's own `Url` type is expected.
const urlLikeContract = z.string().url().brand<'Url'>();

const httpStatusContract = z
  .number()
  .int()
  .min(HTTP_STATUS_MIN)
  .max(HTTP_STATUS_MAX)
  .brand<'HttpStatus'>();

const responseBodyContract = z.string().brand<'ResponseBody'>();

export const httpResponseContract = z.object({
  url: urlLikeContract,
  status: httpStatusContract,
  body: responseBodyContract,
});

export type HttpResponse = z.infer<typeof httpResponseContract>;
export type HttpStatus = z.infer<typeof httpStatusContract>;
export type ResponseBody = z.infer<typeof responseBodyContract>;
