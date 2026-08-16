/**
 * PURPOSE: Maps each role that runs as an orchestrator over a planner/worker/reviewer grouping
 * to the discipline that parameterizes those three phase prompts. `spiritmender`, `warpgate`,
 * and the two COMMAND roles (`ward`, `riftcarver`) are deliberately ABSENT — a role missing
 * from this map is served its own bespoke prompt, and a lookup here returning `undefined` is
 * the signal for that, not an error.
 *
 * USAGE:
 * roleToDisciplineStatics.codeweaver;
 * // Returns 'implementation'
 */

export const roleToDisciplineStatics = {
  codeweaver: 'implementation',
  pesteater: 'bug-repro',
  flowrider: 'below-browser',
  groundstomper: 'browser-e2e',
  siegemaster: 'manual-qa',
} as const;
