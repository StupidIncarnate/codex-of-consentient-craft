/**
 * PURPOSE: Immutable map of valid quest status transitions
 *
 * USAGE:
 * questStatusTransitionsStatics['created'];
 * // Returns: ['explore_flows']
 */

export const questStatusTransitionsStatics = {
  created: ['explore_flows'],
  pending: ['explore_flows'],
  explore_flows: ['review_flows'],
  review_flows: ['flows_approved', 'explore_flows'],
  flows_approved: ['explore_observables'],
  explore_observables: ['review_observables'],
  review_observables: ['approved', 'explore_observables'],
  approved: ['in_progress'],
  in_progress: ['blocked', 'complete', 'abandoned'],
  blocked: ['in_progress', 'abandoned'],
  complete: [],
  abandoned: [],
} as const;
