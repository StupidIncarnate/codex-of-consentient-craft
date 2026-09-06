/**
 * PURPOSE: HTTP status code constants used by the web package. Keeps adapter and
 * contract code free of magic numbers when they validate or differentiate response
 * semantics (e.g. 409 = "play denied by the MCP loop" vs. 5xx = real server failure).
 *
 * USAGE:
 * z.number().int().min(httpStatusStatics.range.min).max(httpStatusStatics.range.max);
 * // Bounds an HttpStatusCode contract to the valid status range
 */
export const httpStatusStatics = {
  conflict: 409,
  range: {
    min: 100,
    max: 599,
  },
  ok: {
    min: 200,
    // Exclusive upper bound — 300 is a redirect, not a success. Matches fetch's own
    // Response.ok definition.
    max: 300,
  },
} as const;
