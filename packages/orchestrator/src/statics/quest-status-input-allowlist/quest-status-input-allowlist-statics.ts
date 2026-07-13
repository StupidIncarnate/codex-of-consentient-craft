/**
 * PURPOSE: Per-status allowlist of top-level input fields for modify-quest, plus nested-path rules
 *
 * USAGE:
 * questStatusInputAllowlistStatics.explore_flows.allowedFields;
 * // Returns: ['title', 'flows', 'designDecisions', 'status']
 * questStatusInputAllowlistStatics.explore_observables.allowedFields;
 * // Includes 'operations' — ChaosWhisperer authors the implementation plan items there. No other
 * // status allows `operations`, so an execution agent's modify-quest{operations} at in_progress is
 * // rejected — the orchestrator's own runtime ledger writes go through questOperationsUpdateBroker,
 * // which bypasses this gate entirely.
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
 * - allowedPlanningNotesFields: per-status rule for `planningNotes.*` sub-field writes
 *     readonly Field[]  -> sub-field allowlist: when `planningNotes` is written, every sub-field present must
 *                          appear in this array, otherwise the write is rejected BY NAME (`Sub-field
 *                          'planningNotes.<x>' not allowed`). An empty [] combined with `planningNotes` being
 *                          absent from allowedFields rejects the whole field wholesale (`Field 'planningNotes'
 *                          not allowed`).
 *     'all'             -> no sub-field gating: any `planningNotes` sub-field is writable, AND a `planningNotes`
 *                          payload is accepted even though `planningNotes` is NOT in allowedFields.
 */

export type QuestStatusFlowsRule =
  | 'forbidden'
  | 'full'
  | 'no-observables'
  | 'observable-wording-only';

export type QuestStatusPlanningNotesField = 'blightReports';

export const questStatusInputAllowlistStatics = {
  pending: {
    allowedFields: ['title', 'status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  created: {
    allowedFields: ['title', 'status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  explore_flows: {
    allowedFields: ['title', 'flows', 'designDecisions', 'status'],
    flowsRule: 'no-observables',
    allowedPlanningNotesFields: [],
  },
  review_flows: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_flows',
      fields: ['flows', 'designDecisions'],
    },
    flowsRule: 'no-observables',
    allowedPlanningNotesFields: [],
  },
  flows_approved: {
    allowedFields: [
      'flows',
      'designDecisions',
      'contracts',
      'toolingRequirements',
      'packagesAffected',
      'operations',
      'status',
    ],
    flowsRule: 'full',
    allowedPlanningNotesFields: [],
  },
  explore_observables: {
    allowedFields: [
      'flows',
      'designDecisions',
      'contracts',
      'toolingRequirements',
      'packagesAffected',
      'operations',
      'status',
    ],
    flowsRule: 'full',
    allowedPlanningNotesFields: [],
  },
  review_observables: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_observables',
      fields: [
        'flows',
        'designDecisions',
        'contracts',
        'toolingRequirements',
        'packagesAffected',
        'operations',
      ],
    },
    flowsRule: 'full',
    allowedPlanningNotesFields: [],
  },
  approved: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  explore_design: {
    allowedFields: ['designDecisions', 'status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  review_design: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_design',
      fields: ['designDecisions'],
    },
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  design_approved: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  in_progress: {
    allowedFields: ['contracts', 'toolingRequirements', 'flows', 'status'],
    flowsRule: 'observable-wording-only',
    // 'all' accepts a planningNotes payload even though planningNotes is not in allowedFields —
    // blightwarden minions write blightReports (the only sub-field on the contract) mid-run.
    allowedPlanningNotesFields: 'all',
  },
  paused: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  blocked: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  complete: {
    allowedFields: [],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  abandoned: {
    allowedFields: [],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
} as const;
