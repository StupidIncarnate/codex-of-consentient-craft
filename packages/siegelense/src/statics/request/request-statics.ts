/**
 * PURPOSE: Immutable configuration values and defaults for HTTP request step execution,
 * defining the default HTTP method ('GET'), request timeout (10000ms), and reading format
 * delimiters. Reach for this over inline literals so request step knobs stay centralized and
 * consistent across contracts, adapters, transformers, and brokers.
 *
 * USAGE:
 * requestStatics.defaults.method;
 * // Returns 'GET'
 * requestStatics.defaults.timeoutMs;
 * // Returns 10000
 */

export const requestStatics = {
  defaults: {
    method: 'GET',
    timeoutMs: 10000,
    status: 200,
    statusText: 'OK',
  },
  reading: {
    delimiter: ' — ',
  },
  status: {
    ok: 200,
    clientErrorThreshold: 400,
  },
} as const;
