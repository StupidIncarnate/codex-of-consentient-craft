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
    explore_flows: ['flows', 'designDecisions'],
    review_flows: ['flows', 'designDecisions'],
    flows_approved: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    explore_observables: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    review_observables: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    approved: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    in_progress: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    blocked: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    complete: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    abandoned: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
  },
  headers: {
    created: 'QUEST CREATED',
    pending: 'QUEST CREATED',
    explore_flows: 'EXPLORING FLOWS',
    review_flows: 'FLOW APPROVAL',
    flows_approved: 'FLOWS APPROVED',
    explore_observables: 'EXPLORING OBSERVABLES',
    review_observables: 'OBSERVABLES APPROVAL',
    approved: 'SPEC APPROVED',
    in_progress: 'SPEC APPROVED',
    blocked: 'SPEC APPROVED',
    complete: 'SPEC APPROVED',
    abandoned: 'SPEC APPROVED',
  },
  nextApprovalStatus: {
    created: null,
    pending: null,
    explore_flows: null,
    review_flows: 'flows_approved',
    flows_approved: null,
    explore_observables: null,
    review_observables: 'approved',
    approved: null,
    in_progress: null,
    blocked: null,
    complete: null,
    abandoned: null,
  },
} as const;
