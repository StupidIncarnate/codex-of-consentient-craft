/**
 * PURPOSE: Per-status allowlist of top-level input fields for modify-quest, plus nested-path rules
 *
 * USAGE:
 * questStatusInputAllowlistStatics.explore_flows.allowedFields;
 * // Returns: ['title', 'flows', 'designDecisions', 'packagesAffected', 'comments', 'status']
 * questStatusInputAllowlistStatics.explore_observables.allowedFields;
 * // Never includes 'operations' — no status does. The implementation ledger is DERIVED at Start
 * // (questBuildRelayGraphBroker) from the flow nodes' `packages` tags and the contracts' `source`
 * // paths, not authored by any agent, so `operations` sits nowhere on this allowlist and every
 * // modify-quest{operations} write is rejected regardless of status. The orchestrator's own runtime
 * // ledger writes go through questOperationsUpdateBroker, which bypasses this gate entirely.
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

export type QuestStatusPlanningNotesField = 'blightLedger' | 'questNotes';

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
  // `packagesAffected` opens here, one gate earlier than the observables phase, because a node's
  // `packages` tag is authored WITH the node and must draw from a name this list already holds.
  // Without it Chaos cannot state the entry and the tag in one call, and the tag is refused for
  // naming a package the quest never declared.
  explore_flows: {
    allowedFields: ['title', 'flows', 'designDecisions', 'packagesAffected', 'comments', 'status'],
    flowsRule: 'no-observables',
    allowedPlanningNotesFields: [],
  },
  // `packagesAffected` joins the back-edge for the same reason it joins `explore_flows`: the user
  // rejecting flows sends Chaos back to RETAG nodes, and a retag that reaches for a package not yet
  // declared needs the entry to land in the same call. Omitting it here breaks the reject loop
  // exactly when it matters.
  review_flows: {
    allowedFields: ['comments', 'status'],
    backTransitionFields: {
      toStatus: 'explore_flows',
      fields: ['flows', 'designDecisions', 'packagesAffected'],
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
  in_progress: {
    // packagesAffected is writable here because a session repairing a gap the bucket partition
    // missed can pull in a package the spec never listed, and every later session reads that field.
    allowedFields: ['contracts', 'toolingRequirements', 'flows', 'packagesAffected', 'status'],
    flowsRule: 'additive-only',
    // 'all' accepts a planningNotes payload even though planningNotes is not in allowedFields:
    // a reviewer-minion writes the per-unit `blightLedger` mid-run — the dispositions its parent's
    // own signal-back review-coverage gate is computed against — and a planner-minion writes
    // `operationPlans`, the plan its operator reads back rather than holding in context. Every
    // execution role also appends `questNotes`, the durable side channel for open questions,
    // tooling errors, out-of-scope observations, and walk resets; this is the only status those
    // roles run at, so it is the only status that need accept them. Verification sign-offs are not
    // here at all — they ride `flows`, on the element that carries them.
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
  merging: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  merged: {
    allowedFields: [],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  // `status` is writable at `complete` so the merge route can move a finished quest to `merging`.
  // The transition guard is what bounds it: `questStatusTransitionsStatics.complete` lists
  // `merging` alone, so this allowlist entry opens exactly that one edge and nothing else. Without
  // it the field-level gate rejects the write before the transition guard is ever consulted, and a
  // complete quest can never be merged. `merged` and `abandoned` stay closed — nothing transitions
  // out of either.
  complete: {
    allowedFields: ['status'],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
  abandoned: {
    allowedFields: [],
    flowsRule: 'forbidden',
    allowedPlanningNotesFields: [],
  },
} as const;
