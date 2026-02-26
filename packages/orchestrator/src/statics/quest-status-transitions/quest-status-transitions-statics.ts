/**
 * PURPOSE: Immutable map of valid quest status transitions
 *
 * USAGE:
 * questStatusTransitionsStatics['created'];
 * // Returns: ['flows_approved']
 */

export const questStatusTransitionsStatics = {
  created: ['flows_approved'],
  pending: ['flows_approved'],
  flows_approved: ['requirements_approved'],
  requirements_approved: ['approved'],
  approved: ['in_progress'],
  in_progress: ['blocked', 'complete', 'abandoned'],
  blocked: ['in_progress', 'abandoned'],
  complete: [],
  abandoned: [],
} as const;
