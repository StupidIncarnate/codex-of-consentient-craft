/**
 * PURPOSE: The structured reading produced by an HTTP request step execution, containing
 * response status, status text, response headers, and parsed or raw body. Reach for this
 * over a generic response object so results queries and evidence records can inspect HTTP
 * exchange outcomes consistently.
 *
 * USAGE:
 * httpRequestReadingContract.parse({ status: 200, statusText: 'OK', headers: {}, body: {} });
 * // Returns validated HttpRequestReading
 */

import { z } from 'zod';

export const httpRequestReadingContract = z
  .object({
    status: z.number().int().brand<'HttpRequestStatus'>(),
    statusText: z.string().brand<'HttpRequestStatusText'>(),
    headers: z.record(z.string().brand<'HttpHeaderValue'>()),
    body: z.unknown(),
  })
  .strict();

export type HttpRequestReading = z.infer<typeof httpRequestReadingContract>;
