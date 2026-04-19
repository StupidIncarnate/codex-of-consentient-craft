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
        seek_scope: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        seek_synth: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        seek_walk: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        seek_plan: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        in_progress: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        paused: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        blocked: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        complete: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        abandoned: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
      },
    });
  });
});
