/**
 * PURPOSE: The fixed clock every ingredient in this package derives a stamped timestamp from,
 * instead of `Date.now()`. Reach for this wherever a route needs a deterministic ISO timestamp —
 * `session.harness.ts:314-316`'s own fixed epoch (`new Date('2026-04-29T20:00:00.000Z')`) is the
 * strictest of the existing harnesses' conventions, so this package makes it the only one.
 *
 * USAGE:
 * seedEpochStatics.epoch.iso;
 * // Returns '2026-04-29T20:00:00.000Z'
 */
export const seedEpochStatics = {
  epoch: {
    iso: '2026-04-29T20:00:00.000Z',
  },
} as const;
