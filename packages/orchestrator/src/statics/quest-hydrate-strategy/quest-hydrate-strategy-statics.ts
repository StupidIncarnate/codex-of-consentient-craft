/**
 * PURPOSE: Per-status strategy map driving quest-hydrate-broker's modify-quest walk from created to in_progress
 *
 * USAGE:
 * for (const toStatus of questHydrateStrategyStatics.walkPath) {
 *   const strategy = questHydrateStrategyStatics.strategies[toStatus];
 *   // strategy.fromStatus, strategy.blueprintFields, strategy.planningNotesFields, strategy.flowsMode
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
    'seek_scope',
    'seek_synth',
    'seek_walk',
    'seek_plan',
    'in_progress',
  ] as const,
  strategies: {
    explore_flows: {
      fromStatus: 'created',
      blueprintFields: [],
      planningNotesFields: [],
      flowsMode: 'exclude',
    },
    review_flows: {
      fromStatus: 'explore_flows',
      blueprintFields: ['designDecisions'],
      planningNotesFields: [],
      flowsMode: 'no-observables',
    },
    flows_approved: {
      fromStatus: 'review_flows',
      blueprintFields: [],
      planningNotesFields: [],
      flowsMode: 'exclude',
    },
    explore_observables: {
      fromStatus: 'flows_approved',
      blueprintFields: ['contracts', 'toolingRequirements'],
      planningNotesFields: [],
      flowsMode: 'exclude',
    },
    review_observables: {
      fromStatus: 'explore_observables',
      blueprintFields: [],
      planningNotesFields: [],
      flowsMode: 'full',
    },
    approved: {
      fromStatus: 'review_observables',
      blueprintFields: [],
      planningNotesFields: [],
      flowsMode: 'exclude',
    },
    seek_scope: {
      fromStatus: 'approved',
      blueprintFields: [],
      planningNotesFields: [],
      flowsMode: 'exclude',
    },
    seek_synth: {
      fromStatus: 'seek_scope',
      blueprintFields: [],
      planningNotesFields: ['scopeClassification'],
      flowsMode: 'exclude',
    },
    seek_walk: {
      fromStatus: 'seek_synth',
      blueprintFields: [],
      planningNotesFields: ['surfaceReports', 'synthesis'],
      flowsMode: 'exclude',
    },
    seek_plan: {
      fromStatus: 'seek_walk',
      blueprintFields: [],
      planningNotesFields: ['walkFindings'],
      flowsMode: 'exclude',
    },
    in_progress: {
      fromStatus: 'seek_plan',
      blueprintFields: ['steps'],
      planningNotesFields: ['reviewReport'],
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
