/**
 * PURPOSE: Immutable configuration values and defaults for the `storage` step verb, defining the
 * default key prefix ('') to match all localStorage and sessionStorage keys when no prefix is specified.
 * Reach for this over inline literals so storage step settings stay centralized and consistent across
 * contracts, brokers, and adapters.
 *
 * USAGE:
 * storageStatics.defaults.prefix;
 * // Returns ''
 */

export const storageStatics = {
  defaults: {
    prefix: '',
  },
} as const;
