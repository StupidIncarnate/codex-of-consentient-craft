/**
 * PURPOSE: Maps quest gate target statuses to required non-empty array fields on the quest
 *
 * USAGE:
 * questGateContentRequirementsStatics.gates.flows_approved;
 * // Returns ['flows'] - the quest fields that must be non-empty to transition to flows_approved
 *
 * A requirement is a dot-path string: the field must exist, and an array field must be non-empty.
 *
 * `approved` demands nothing beyond `flows`, and that is deliberate: the codeweaver items are
 * DERIVED at Start from the flow nodes' package tags and the contracts' source paths
 * (`fanOutBy: 'implementation'`), so coverage is definitional rather than checked — a quest that
 * clears `flows_approved` already carries every input the generator reads.
 *
 * What DID stay checkable moved to `questSaveInvariantsTransformer` as `Contract Source Coverage`:
 * a contract's `source` must resolve to a declared package, or it reaches no implementation item at
 * all. That check names the offender, which this guard structurally cannot — its
 * rejection is the detail-free `Missing required content for transition to <status>`.
 */

export const questGateContentRequirementsStatics = {
  gates: {
    flows_approved: ['flows'],
    approved: ['flows'],
    design_approved: ['flows'],
  },
} as const;
