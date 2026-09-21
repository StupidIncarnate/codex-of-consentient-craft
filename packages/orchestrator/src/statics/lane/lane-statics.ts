/**
 * PURPOSE: The siegelense spec a `needsLane` step boots. `@dungeonmaster/siegelense`'s own
 * `laneSpecStatics.specs['dungeonmaster-stack'].name` is the source of truth, and the orchestrator
 * cannot import it — depending on `@dungeonmaster/siegelense` is a cycle, so every reach into that
 * package goes through a runtime dynamic import instead of a static one. `defaults.specName` is
 * therefore a deliberate restatement, not a guess: `dungeonmaster-stack` is the browsered spec (api
 * + web + Chromium), and the more expensive of the two built-ins, so every siege walker — which
 * always drives a browser — boots against it rather than the browserless `dungeonmaster-api`.
 *
 * USAGE:
 * laneStatics.defaults.specName;
 * // Returns 'dungeonmaster-stack'
 */

export const laneStatics = {
  defaults: {
    specName: 'dungeonmaster-stack',
  },
} as const;
