import { questGateSectionsStatics } from './quest-gate-sections-statics';

describe('questGateSectionsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questGateSectionsStatics).toStrictEqual({
      sections: {
        created: ['flows', 'designDecisions'],
        pending: ['flows', 'designDecisions'],
        explore_flows: ['flows', 'designDecisions'],
        review_flows: ['flows', 'designDecisions'],
        flows_approved: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        explore_observables: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        review_observables: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        approved: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        explore_design: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        review_design: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        design_approved: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
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
        explore_design: 'EXPLORING DESIGN',
        review_design: 'DESIGN APPROVAL',
        design_approved: 'DESIGN APPROVED',
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
        explore_design: null,
        review_design: 'design_approved',
        design_approved: null,
        in_progress: null,
        blocked: null,
        complete: null,
        abandoned: null,
      },
    });
  });
});
