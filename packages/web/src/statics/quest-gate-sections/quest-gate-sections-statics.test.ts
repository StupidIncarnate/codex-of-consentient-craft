import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

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
        paused: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        blocked: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        complete: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        merging: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        merged: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        abandoned: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
      },
    });
  });

  it('VALID: sections => carries an entry for every quest status', () => {
    // Object.keys(...) here is the deliberate exception: this test's whole subject is key
    // coverage, and the values themselves are already pinned exhaustively above.
    expect(Object.keys(questGateSectionsStatics.sections).sort()).toStrictEqual(
      Object.keys(questStatusMetadataStatics.statuses).sort(),
    );
  });
});
