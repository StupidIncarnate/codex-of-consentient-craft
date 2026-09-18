/**
 * PURPOSE: Static definitions for the `resize` step verb, including reading format templates.
 * Reach for this over inline strings so formatting patterns stay in one place across the codebase.
 *
 * USAGE:
 * resizeStatics.template;
 * // Returns 'resized to {width}x{height}'
 */

export const resizeStatics = {
  template: 'resized to {width}x{height}',
  reading: {
    template: 'resized to {width}x{height}',
  },
} as const;
