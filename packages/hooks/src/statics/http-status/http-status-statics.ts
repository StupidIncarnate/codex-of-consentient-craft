/**
 * PURPOSE: HTTP status code constants used by the hooks package. Keeps responder and
 * contract code free of magic numbers when they need to validate or differentiate
 * response semantics (e.g. 404 = "no quest for this session" vs. 5xx = real server failure).
 *
 * USAGE:
 * if (response.status === httpStatusStatics.notFound) { return okResult; }
 * z.number().int().min(httpStatusStatics.range.min).max(httpStatusStatics.range.max)
 */
export const httpStatusStatics = {
  notFound: 404,
  range: {
    min: 100,
    max: 599,
  },
  successRange: {
    minInclusive: 200,
    maxExclusive: 300,
  },
} as const;
