/**
 * PURPOSE: The two lane names a `--spec` flag can name — 'stack' boots every process
 * `devServer.e2e.processes` configures with a Chromium session riding along, 'api' boots the same
 * processes headless. Reach for this over a literal string wherever code decides which of the two
 * shapes a spec name selects, or derives a default spec name to fall back on; `laneSpecFindBroker` is
 * the one place that reads it to decide `LaneSpec.browser`.
 *
 * USAGE:
 * laneSpecConventionStatics.browsered;
 * // Returns 'stack'
 */

export const laneSpecConventionStatics = {
  browsered: 'stack',
  headless: 'api',
} as const;
