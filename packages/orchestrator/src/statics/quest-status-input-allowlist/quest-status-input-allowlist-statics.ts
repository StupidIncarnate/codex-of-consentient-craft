/**
 * PURPOSE: Per-status allowlist of top-level input fields for modify-quest, plus nested-path rules
 *
 * USAGE:
 * questStatusInputAllowlistStatics.explore_flows.allowedFields;
 * // Returns: ['title', 'flows', 'designDecisions', 'comments', 'status']
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
 *     'additive-only'            -> an execution agent may only ADD to the spine, never shrink it:
 *                                   node/edge/observable ADD allowed on an EXISTING flow, plus
 *                                   wording/type updates on existing observables; every DELETE is
 *                                   refused, and a whole new flow is refused. Adding constrains the
 *                                   agent further (a branch it discovered, an assertion it owes),
 *                                   so it cannot be used to slip past a gate; deleting or replacing
 *                                   a flow could erase the acceptance target the agent is judged on.
 * - allowedPlanningNotesFields: per-status rule for `planningNotes.*` sub-field writes
 *     readonly Field[]  -> sub-field allowlist: when `planningNotes` is written, every sub-field present must
 *                          appear in this array, otherwise the write is rejected BY NAME (`Sub-field
 *                          'planningNotes.<x>' not allowed`). An empty [] combined with `planningNotes` being
 *                          absent from allowedFields rejects the whole field wholesale (`Field 'planningNotes'
 *                          not allowed`).
 *     'all'             -> no sub-field gating: any `planningNotes` sub-field is writable, AND a `planningNotes`
 *                          payload is accepted even though `planningNotes` is NOT in allowedFields.
 */

export type QuestStatusFlowsRule = 'forbidden' | 'full' | 'no-observables' | 'additive-only';

export type QuestStatusPlanningNotesField = 'blightReports';

export const questStatusInputAllowlistStatics = {
  // `comments` joins `allowedFields` ONLY at the statuses that precede `approved` — pending,
  // created, explore_flows, review_flows, flows_approved, explore_observables, review_observables.
  // The comment icon button and queue toolbar (the compose affordances) render only while quest
  // status precedes `approved` (#dd-comment-controls-before-approved), so a comment write arriving
  // at `approved` or later means the browser sent something it should never have offered. This is a
  // per-status decision, which is why it lives here rather than being unconditionally stripped like
  // `workItems`/`wardResults`/`designPort` (see inspectable-modify-quest-input-fields-statics).
  pending: {
    allowedFields: ['title', 'comments', 'status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  created: {
    allowedFields: ['title', 'comments', 'status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  explore_flows: {
    allowedFields: ['title', 'flows', 'designDecisions', 'comments', 'status'],
    flowsRule: 'no-observables',
    allowedPlanningNotesFields: [],
  },
  review_flows: {
    allowedFields: ['comments', 'status'],
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
      'comments',
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
      'comments',
      'status',
    ],
    flowsRule: 'full',
    allowedPlanningNotesFields: [],
  },
  review_observables: {
    allowedFields: ['comments', 'status'],
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
    // packagesAffected is writable here because a session repairing a gap the bucket partition
    // missed can pull in a package the spec never listed, and every later session reads that field.
    allowedFields: ['contracts', 'toolingRequirements', 'flows', 'packagesAffected', 'status'],
    flowsRule: 'additive-only',
    // 'all' accepts a planningNotes payload even though planningNotes is not in allowedFields:
    // blightwarden minions write `blightReports` mid-run, and siegemaster writes `qaLedger` — the
    // per-unit QA dispositions its own signal-back completion gate is then computed against.
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
