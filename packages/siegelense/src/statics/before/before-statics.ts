/**
 * PURPOSE: Static definitions and formatting patterns for the `before` step verb.
 * Reach for this over inline strings so formatting patterns stay in one place across the codebase.
 *
 * USAGE:
 * beforeStatics.template;
 * // Returns 'installed init script ({characters} chars)'
 */

export const beforeStatics = {
  template: 'installed init script ({characters} chars)',
  reading: {
    template: 'installed init script ({characters} chars)',
  },
} as const;
