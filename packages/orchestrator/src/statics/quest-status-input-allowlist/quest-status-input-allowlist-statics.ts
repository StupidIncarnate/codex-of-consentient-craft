/**
 * PURPOSE: Per-status allowlist of top-level input fields for modify-quest, plus nested-path rules
 *
 * USAGE:
 * questStatusInputAllowlistStatics.explore_flows.allowedFields;
 * // Returns: ['title', 'flows', 'designDecisions', 'status']
 * questStatusInputAllowlistStatics.in_progress.flowsRule;
 * // Returns: 'observable-wording-only' (flows allowed only for in-place observable replacement)
 * questStatusInputAllowlistStatics.in_progress.blightReportsRule;
 * // Returns: 'full' (Blightwarden writes to planningNotes.blightReports during in_progress)
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
 * - blightReportsRule: nested-path rule for `planningNotes.blightReports` input (scoped to that sub-field only)
 *     'forbidden'                -> planningNotes.blightReports input is never allowed
 *     'full'                     -> any blightReports upsert (add/update/delete) allowed
 */

export type QuestStatusFlowsRule =
  | 'forbidden'
  | 'full'
  | 'no-observables'
  | 'observable-wording-only';

export type QuestStatusBlightReportsRule = 'forbidden' | 'full';

export const questStatusInputAllowlistStatics = {
  pending: {
    allowedFields: ['title', 'status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  created: {
    allowedFields: ['title', 'status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  explore_flows: {
    allowedFields: ['title', 'flows', 'designDecisions', 'status'],
    flowsRule: 'no-observables',
    blightReportsRule: 'forbidden',
  },
  review_flows: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_flows',
      fields: ['flows', 'designDecisions'],
    },
    flowsRule: 'no-observables',
    blightReportsRule: 'forbidden',
  },
  flows_approved: {
    allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
    flowsRule: 'full',
    blightReportsRule: 'forbidden',
  },
  explore_observables: {
    allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
    flowsRule: 'full',
    blightReportsRule: 'forbidden',
  },
  review_observables: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_observables',
      fields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    },
    flowsRule: 'full',
    blightReportsRule: 'forbidden',
  },
  approved: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  explore_design: {
    allowedFields: ['designDecisions', 'status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  review_design: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_design',
      fields: ['designDecisions'],
    },
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  design_approved: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  seek_scope: {
    allowedFields: ['planningNotes', 'status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  seek_synth: {
    allowedFields: ['planningNotes', 'contracts', 'toolingRequirements', 'flows', 'status'],
    flowsRule: 'observable-wording-only',
    blightReportsRule: 'forbidden',
  },
  seek_walk: {
    allowedFields: ['planningNotes', 'contracts', 'toolingRequirements', 'flows', 'status'],
    flowsRule: 'observable-wording-only',
    blightReportsRule: 'forbidden',
  },
  seek_plan: {
    allowedFields: [
      'planningNotes',
      'steps',
      'contracts',
      'toolingRequirements',
      'flows',
      'status',
    ],
    flowsRule: 'observable-wording-only',
    blightReportsRule: 'forbidden',
  },
  in_progress: {
    allowedFields: ['steps', 'contracts', 'toolingRequirements', 'flows', 'status'],
    flowsRule: 'observable-wording-only',
    blightReportsRule: 'full',
  },
  paused: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  blocked: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  complete: {
    allowedFields: [],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
  abandoned: {
    allowedFields: [],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
  },
} as const;
