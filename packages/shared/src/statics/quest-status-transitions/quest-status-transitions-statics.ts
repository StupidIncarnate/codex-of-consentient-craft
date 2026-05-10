/**
 * PURPOSE: Immutable map of valid quest status transitions
 *
 * USAGE:
 * questStatusTransitionsStatics['created'];
 * // Returns: ['explore_flows', 'paused']
 */

export const questStatusTransitionsStatics = {
  created: ['explore_flows', 'paused'],
  pending: ['explore_flows', 'paused'],
  explore_flows: ['review_flows', 'paused'],
  review_flows: ['flows_approved', 'explore_flows', 'paused'],
  flows_approved: ['explore_observables', 'paused'],
  explore_observables: ['review_observables', 'paused'],
  review_observables: ['approved', 'explore_observables', 'paused'],
  approved: ['seek_scope', 'explore_design', 'paused'],
  explore_design: ['review_design', 'paused'],
  review_design: ['design_approved', 'explore_design', 'paused'],
  design_approved: ['seek_scope', 'explore_design', 'paused'],
  seek_scope: ['seek_synth', 'abandoned', 'paused'],
  seek_synth: ['seek_walk', 'seek_scope', 'abandoned', 'paused'],
  seek_walk: ['in_progress', 'seek_scope', 'abandoned', 'paused'],
  in_progress: [
    'in_progress',
    'paused',
    'blocked',
    'complete',
    'abandoned',
    'seek_walk',
    'seek_scope',
  ],
  paused: [
    'created',
    'pending',
    'explore_flows',
    'review_flows',
    'flows_approved',
    'explore_observables',
    'review_observables',
    'approved',
    'explore_design',
    'review_design',
    'design_approved',
    'seek_scope',
    'seek_synth',
    'seek_walk',
    'in_progress',
    'blocked',
    'abandoned',
  ],
  blocked: ['in_progress', 'abandoned', 'paused'],
  complete: [],
  abandoned: [],
} as const;
