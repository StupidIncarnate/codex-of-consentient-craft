/**
 * PURPOSE: Defines immutable HTTP status code constants for server responses
 *
 * USAGE:
 * httpStatusStatics.success.ok;
 * // Returns 200
 */

export const httpStatusStatics = {
  success: {
    ok: 200,
    created: 201,
  },
  clientError: {
    badRequest: 400,
    notFound: 404,
  },
  serverError: {
    internal: 500,
    notImplemented: 501,
  },
} as const;
