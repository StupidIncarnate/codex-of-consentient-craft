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
 * - blightReportsRule: nested-path rule for `planningNotes.blightReports` input (scoped to that sub-field only)
 *     'forbidden'                -> planningNotes.blightReports input is never allowed
 *     'full'                     -> any blightReports upsert (add/update/delete) allowed AND
 *                                   a blight-only planningNotes payload is permitted even if `planningNotes`
 *                                   is NOT in allowedFields at this status (top-level carveout).
 * - allowedPlanningNotesFields: sub-field positive allowlist for `planningNotes.*` — when `planningNotes`
 *                               input is present, every sub-field being written must appear in this array,
 *                               otherwise the write is rejected regardless of how the top-level field was
 *                               permitted (allowedFields entry OR blightReports carveout).
 */

export type QuestStatusFlowsRule =
  | 'forbidden'
  | 'full'
  | 'no-observables'
  | 'observable-wording-only';

export type QuestStatusBlightReportsRule = 'forbidden' | 'full';

export type QuestStatusPlanningNotesField =
  | 'scopeClassification'
  | 'surfaceReports'
  | 'synthesis'
  | 'walkFindings'
  | 'reviewReport'
  | 'blightReports';

export const questStatusInputAllowlistStatics = {
  pending: {
    allowedFields: ['title', 'status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  created: {
    allowedFields: ['title', 'status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  explore_flows: {
    allowedFields: ['title', 'flows', 'designDecisions', 'status'],
    flowsRule: 'no-observables',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  review_flows: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_flows',
      fields: ['flows', 'designDecisions'],
    },
    flowsRule: 'no-observables',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  flows_approved: {
    allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
    flowsRule: 'full',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  explore_observables: {
    allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
    flowsRule: 'full',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  review_observables: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_observables',
      fields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    },
    flowsRule: 'full',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  approved: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  explore_design: {
    allowedFields: ['designDecisions', 'status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  review_design: {
    allowedFields: ['status'],
    backTransitionFields: {
      toStatus: 'explore_design',
      fields: ['designDecisions'],
    },
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  design_approved: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  seek_scope: {
    allowedFields: ['planningNotes', 'status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
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
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: ['surfaceReports', 'synthesis'],
  },
  seek_walk: {
    allowedFields: ['planningNotes', 'contracts', 'toolingRequirements', 'flows', 'status'],
    flowsRule: 'observable-wording-only',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: ['walkFindings'],
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
    allowedPlanningNotesFields: ['reviewReport'],
  },
  in_progress: {
    allowedFields: ['steps', 'contracts', 'toolingRequirements', 'flows', 'status'],
    flowsRule: 'observable-wording-only',
    blightReportsRule: 'full',
    allowedPlanningNotesFields: ['blightReports'],
  },
  paused: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  blocked: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  complete: {
    allowedFields: [],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  abandoned: {
    allowedFields: [],
    flowsRule: 'forbidden',
    blightReportsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
} as const;
