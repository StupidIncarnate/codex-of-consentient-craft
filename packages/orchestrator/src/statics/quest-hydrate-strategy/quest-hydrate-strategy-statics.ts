/**
 * PURPOSE: Per-status strategy map driving quest-hydrate-broker's modify-quest walk from created to in_progress
 *
 * USAGE:
 * for (const toStatus of questHydrateStrategyStatics.walkPath) {
 *   const strategy = questHydrateStrategyStatics.strategies[toStatus];
 *   // strategy.fromStatus, strategy.blueprintFields, strategy.flowsMode
 * }
 *
 * WHEN-TO-USE: By quest-hydrate-broker to compute each modify-quest payload.
 * WHEN-NOT-TO-USE: Anywhere outside the hydrator; the gate statics in @dungeonmaster/shared are the canonical source for live quest mutations.
 *
 * Exhaustiveness is enforced by the colocated test asserting every quest status has a key in `strategies`.
 * This file intentionally does not import QuestStatus (statics -> contracts is forbidden by architecture).
 */

export const questHydrateStrategyStatics = {
  walkPath: [
    'explore_flows',
    'review_flows',
    'flows_approved',
    'explore_observables',
    'review_observables',
    'approved',
    'in_progress',
  ] as const,
  strategies: {
    explore_flows: {
      fromStatus: 'created',
      blueprintFields: [],
      flowsMode: 'exclude',
    },
    review_flows: {
      fromStatus: 'explore_flows',
      blueprintFields: ['designDecisions'],
      flowsMode: 'no-observables',
    },
    flows_approved: {
      fromStatus: 'review_flows',
      blueprintFields: [],
      flowsMode: 'exclude',
    },
    explore_observables: {
      fromStatus: 'flows_approved',
      // `operations` lands here — the same window ChaosWhisperer authors the implementation
      // plan items in, so the `approved` gate (>=1 codeweaver item) passes on the next hop.
      blueprintFields: ['contracts', 'toolingRequirements', 'operations'],
      flowsMode: 'exclude',
    },
    review_observables: {
      fromStatus: 'explore_observables',
      blueprintFields: [],
      flowsMode: 'full',
    },
    approved: {
      fromStatus: 'review_observables',
      blueprintFields: [],
      flowsMode: 'exclude',
    },
    in_progress: {
      fromStatus: 'approved',
      blueprintFields: [],
      flowsMode: 'exclude',
    },
    created: null,
    pending: null,
    explore_design: null,
    review_design: null,
    design_approved: null,
    paused: null,
    blocked: null,
    complete: null,
    abandoned: null,
  },
} as const;
