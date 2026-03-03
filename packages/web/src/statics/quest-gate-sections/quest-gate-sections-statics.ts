/**
 * PURPOSE: Maps quest statuses to their visible spec panel sections and header labels
 *
 * USAGE:
 * questGateSectionsStatics.sections['flows_approved'];
 * // Returns ['flows', 'designDecisions', 'requirements']
 */

export const questGateSectionsStatics = {
  sections: {
    created: ['flows', 'designDecisions'],
    pending: ['flows', 'designDecisions'],
    flows_approved: ['flows', 'designDecisions', 'requirements'],
    requirements_approved: [
      'flows',
      'designDecisions',
      'requirements',
      'contexts',
      'observables',
      'contracts',
      'toolingRequirements',
    ],
    approved: [
      'flows',
      'designDecisions',
      'requirements',
      'contexts',
      'observables',
      'contracts',
      'toolingRequirements',
    ],
    in_progress: [
      'flows',
      'designDecisions',
      'requirements',
      'contexts',
      'observables',
      'contracts',
      'toolingRequirements',
    ],
    blocked: [
      'flows',
      'designDecisions',
      'requirements',
      'contexts',
      'observables',
      'contracts',
      'toolingRequirements',
    ],
    complete: [
      'flows',
      'designDecisions',
      'requirements',
      'contexts',
      'observables',
      'contracts',
      'toolingRequirements',
    ],
    abandoned: [
      'flows',
      'designDecisions',
      'requirements',
      'contexts',
      'observables',
      'contracts',
      'toolingRequirements',
    ],
  },
  headers: {
    created: 'FLOW APPROVAL',
    pending: 'FLOW APPROVAL',
    flows_approved: 'REQUIREMENTS APPROVAL',
    requirements_approved: 'OBSERVABLES APPROVAL',
    approved: 'SPEC APPROVED',
    in_progress: 'SPEC APPROVED',
    blocked: 'SPEC APPROVED',
    complete: 'SPEC APPROVED',
    abandoned: 'SPEC APPROVED',
  },
  nextApprovalStatus: {
    created: 'flows_approved',
    pending: 'flows_approved',
    flows_approved: 'requirements_approved',
    requirements_approved: 'approved',
    approved: null,
    in_progress: null,
    blocked: null,
    complete: null,
    abandoned: null,
  },
} as const;
