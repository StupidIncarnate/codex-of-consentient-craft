/**
 * PURPOSE: Bounds how long an image path is allowed to be before any filesystem call touches
 * it, so a query value longer than any real path can be refused outright instead of failing
 * deeper inside an fs read
 *
 * USAGE:
 * imageServeStatics.maxPathLength;
 * // Returns 4096
 */

export const imageServeStatics = {
  maxPathLength: 4096,
} as const;
