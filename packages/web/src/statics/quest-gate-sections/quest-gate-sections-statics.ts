/**
 * PURPOSE: Maps quest statuses to their visible spec panel sections and header labels
 *
 * USAGE:
 * questGateSectionsStatics.sections['flows_approved'];
 * // Returns ['flows', 'designDecisions', 'contracts', 'toolingRequirements']
 */

export const questGateSectionsStatics = {
  sections: {
    created: ['flows', 'designDecisions'],
    pending: ['flows', 'designDecisions'],
    flows_approved: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    approved: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    in_progress: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    blocked: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    complete: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    abandoned: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
  },
  headers: {
    created: 'FLOW APPROVAL',
    pending: 'FLOW APPROVAL',
    flows_approved: 'OBSERVABLES APPROVAL',
    approved: 'SPEC APPROVED',
    in_progress: 'SPEC APPROVED',
    blocked: 'SPEC APPROVED',
    complete: 'SPEC APPROVED',
    abandoned: 'SPEC APPROVED',
  },
  nextApprovalStatus: {
    created: 'flows_approved',
    pending: 'flows_approved',
    flows_approved: 'approved',
    approved: null,
    in_progress: null,
    blocked: null,
    complete: null,
    abandoned: null,
  },
} as const;
