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
  approved: ['in_progress', 'explore_design', 'paused'],
  explore_design: ['review_design', 'paused'],
  review_design: ['design_approved', 'explore_design', 'paused'],
  design_approved: ['in_progress', 'explore_design', 'paused'],
  in_progress: ['in_progress', 'paused', 'blocked', 'complete', 'abandoned'],
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
    'in_progress',
    'blocked',
    'merging',
    'abandoned',
  ],
  // blocked lists itself for the same reason merging does below: a quest already blocked can
  // still take a ledger write that leaves it blocked — e.g. questBlockOnFailureBroker attaching a
  // NEW failure reason to a carrier work item that was already terminal from an earlier block.
  // Without the self-edge that write is rejected as an invalid blocked -> blocked transition and
  // the new reason is silently dropped.
  blocked: ['blocked', 'in_progress', 'abandoned', 'paused', 'merging'],
  // merging lists itself for the same reason in_progress and blocked do: status derivation rewrites
  // the quest's status on every ledger write, including writes that leave it unchanged, and
  // the transition guard rejects any status absent from the current status's list. Without
  // the self-edge the first ledger write during a merge is rejected and the merge stalls.
  merging: ['merging', 'merged', 'blocked', 'paused', 'abandoned'],
  complete: ['merging'],
  merged: [],
  abandoned: [],
} as const;
