/**
 * PURPOSE: Maps quest gate target statuses to required non-empty array fields on the quest
 *
 * USAGE:
 * questGateContentRequirementsStatics.gates.flows_approved;
 * // Returns ['flows'] - the quest fields that must be non-empty to transition to flows_approved
 */

export const questGateContentRequirementsStatics = {
  gates: {
    flows_approved: ['flows'],
    requirements_approved: ['requirements'],
    approved: ['observables'],
  },
} as const;
