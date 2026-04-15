/**
 * PURPOSE: Per-status allowlist of top-level input fields for modify-quest, plus nested-path rules
 *
 * USAGE:
 * questStatusInputAllowlistStatics.explore_flows.allowedFields;
 * // Returns: ['title', 'flows', 'designDecisions', 'status']
 * questStatusInputAllowlistStatics.in_progress.flowsRule;
 * // Returns: 'observable-wording-only' (flows allowed only for in-place observable replacement)
 *
 * Entry shape:
 * - allowedFields: top-level input fields always permitted for this status
 * - backTransitionFields?: extra fields permitted ONLY when transitioning to the given toStatus
 * - flowsRule: nested-path rule for `flows` input
 *     'forbidden'                -> flows input is never allowed (rejected by field-level check)
 *     'full'                     -> any flow mutation (add/delete/restructure) allowed
 *     'no-observables'           -> flows allowed but every flows[].nodes[].observables must be empty (length 0)
 *     'observable-wording-only'  -> only in-place replacement on EXISTING flow/node/observable IDs:
 *                                   no flow add/delete, no node add/delete, no edge add/delete,
 *                                   no observable add/delete — only wording/type updates on existing observables
 */

export type QuestStatusFlowsRule =
  | 'forbidden'
  | 'full'
  | 'no-observables'
  | 'observable-wording-only';

export const questStatusInputAllowlistStatics = {
  pending: {
    allowedFields: ['title', 'status'],
    flowsRule: 'forbidden',
  },
  created: {
    allowedFields: ['title', 'status'],
    flowsRule: 'forbidden',
  },
  explore_flows: {
    allowedFields: ['title', 'flows', 'designDecisions', 'status'],
    flowsRule: 'no-observables',
  },
  review_flows: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_flows',
      fields: ['flows', 'designDecisions'],
    },
    flowsRule: 'no-observables',
  },
  flows_approved: {
    allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
    flowsRule: 'full',
  },
  explore_observables: {
    allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
    flowsRule: 'full',
  },
  review_observables: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_observables',
      fields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    },
    flowsRule: 'full',
  },
  approved: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
  },
  explore_design: {
    allowedFields: ['designDecisions', 'status'],
    flowsRule: 'forbidden',
  },
  review_design: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_design',
      fields: ['designDecisions'],
    },
    flowsRule: 'forbidden',
  },
  design_approved: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
  },
  in_progress: {
    allowedFields: ['steps', 'contracts', 'toolingRequirements', 'flows', 'status'],
    flowsRule: 'observable-wording-only',
  },
  paused: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
  },
  blocked: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
  },
  complete: {
    allowedFields: [],
    flowsRule: 'forbidden',
  },
  abandoned: {
    allowedFields: [],
    flowsRule: 'forbidden',
  },
} as const;
