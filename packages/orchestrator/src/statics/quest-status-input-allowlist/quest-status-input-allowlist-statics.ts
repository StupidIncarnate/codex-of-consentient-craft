/**
 * PURPOSE: Per-status allowlist of top-level input fields for modify-quest, plus nested-path rules
 *
 * USAGE:
 * questStatusInputAllowlistStatics.explore_flows.allowedFields;
 * // Returns: ['title', 'flows', 'designDecisions', 'status']
 * questStatusInputAllowlistStatics.in_progress.allowedPlanningNotesFields;
 * // Returns: 'all' (in_progress accepts any planningNotes sub-field — no per-phase gating)
 * questStatusInputAllowlistStatics.seek_walk.allowedPlanningNotesFields;
 * // Returns: ['walkFindings'] (PathSeeker writes only walkFindings during seek_walk)
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
 *                          not allowed`). Every status BEFORE `in_progress` (spec/design phases plus the
 *                          seek_scope/seek_synth/seek_walk planning phases) keeps its sub-field allowlist so
 *                          each phase retains its write-discipline.
 *     'all'             -> no sub-field gating: any `planningNotes` sub-field is writable, AND a `planningNotes`
 *                          payload is accepted even though `planningNotes` is NOT in allowedFields. Only
 *                          `in_progress` uses this — PathSeeker runs its ENTIRE planning lifecycle (scope →
 *                          surface → synthesis → walk) while the quest stays `in_progress`, so the execution
 *                          window imposes no per-phase planningNotes write-discipline.
 */

export type QuestStatusFlowsRule =
  | 'forbidden'
  | 'full'
  | 'no-observables'
  | 'observable-wording-only';

export type QuestStatusPlanningNotesField =
  | 'scopeClassification'
  | 'surfaceReports'
  | 'synthesis'
  | 'walkFindings'
  | 'blightReports'
  | 'codeweaverPlans';

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
      'status',
    ],
    flowsRule: 'full',
    allowedPlanningNotesFields: [],
  },
  review_observables: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_observables',
      fields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'packagesAffected'],
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
  seek_scope: {
    allowedFields: ['planningNotes', 'status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: ['scopeClassification'],
  },
  seek_synth: {
    allowedFields: [
      'planningNotes',
      'steps',
      'contracts',
      'toolingRequirements',
      'flows',
      'status',
    ],
    flowsRule: 'observable-wording-only',
    allowedPlanningNotesFields: ['surfaceReports', 'synthesis'],
  },
  seek_walk: {
    allowedFields: [
      'planningNotes',
      'steps',
      'contracts',
      'toolingRequirements',
      'flows',
      'status',
    ],
    flowsRule: 'observable-wording-only',
    allowedPlanningNotesFields: ['walkFindings'],
  },
  in_progress: {
    allowedFields: ['steps', 'contracts', 'toolingRequirements', 'flows', 'status'],
    flowsRule: 'observable-wording-only',
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
