/**
 * PURPOSE: Maps quest gate target statuses to required non-empty array fields on the quest
 *
 * USAGE:
 * questGateContentRequirementsStatics.gates.flows_approved;
 * // Returns ['flows'] - the quest fields that must be non-empty to transition to flows_approved
 *
 * A requirement is either a dot-path string (field must exist; arrays must be non-empty) or an
 * object form { field, contains: { key, value }, questTypes? } (field must be a non-empty array
 * with at least one entry whose [key] === value; when questTypes is present the requirement only
 * applies to quests of those types). The object form is how `approved` demands an operations
 * ledger containing at least one role:codeweaver implementation item — feature-only, because a
 * bug-hunt's operation items (the pesteater chain) are seeded by the orchestrator at Start, not
 * authored at spec time.
 */

export const questGateContentRequirementsStatics = {
  gates: {
    flows_approved: ['flows'],
    approved: [
      'flows',
      {
        field: 'operations',
        contains: { key: 'role', value: 'codeweaver' },
        questTypes: ['feature'],
      },
    ],
    design_approved: ['flows'],
  },
} as const;
