/**
 * PURPOSE: The siegelense spec a `needsLane` step boots. `@dungeonmaster/siegelense`'s own
 * `laneSpecConventionStatics.browsered` is the source of truth, and the orchestrator cannot import
 * it — depending on `@dungeonmaster/siegelense` is a cycle, so every reach into that package goes
 * through a runtime dynamic import instead of a static one. `defaults.specName` is therefore a
 * deliberate restatement, not a guess: `stack` boots every process a repo's own
 * `devServer.e2e.processes` names, with a browser riding along, and is the more expensive of the two
 * conventions, so every siege walker — which always drives a browser — boots against it rather than
 * the browserless `api`.
 *
 * USAGE:
 * laneStatics.defaults.specName;
 * // Returns 'stack'
 */

export const laneStatics = {
  defaults: {
    specName: 'stack',
  },
} as const;
