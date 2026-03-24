/**
 * PURPOSE: Defines immutable configuration values for network log recording and formatting
 *
 * USAGE:
 * networkLogStatics.limits.maxEntries;
 * // Returns 50
 */

export const networkLogStatics = {
  limits: {
    maxEntries: 50,
    maxBodyLength: 1500,
  },
  delimiters: {
    start: '__NETWORK_LOG__',
    end: '__NETWORK_LOG_END__',
  },
  filters: {
    apiPathFilter: '/api/',
  },
  formatting: {
    methodPadWidth: 4,
    noBodyPlaceholder: '(no body)',
    unknownStatus: '???',
  },
} as const;
