import { questStatusTransitionsStatics } from './quest-status-transitions-statics';

describe('questStatusTransitionsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatusTransitionsStatics).toStrictEqual({
      created: ['explore_flows'],
      pending: ['explore_flows'],
      explore_flows: ['review_flows'],
      review_flows: ['flows_approved', 'explore_flows'],
      flows_approved: ['explore_observables'],
      explore_observables: ['review_observables'],
      review_observables: ['approved', 'explore_observables'],
      approved: ['in_progress', 'explore_design'],
      explore_design: ['review_design'],
      review_design: ['design_approved', 'explore_design'],
      design_approved: ['in_progress', 'explore_design'],
      in_progress: ['in_progress', 'blocked', 'complete', 'abandoned'],
      blocked: ['in_progress', 'abandoned'],
      complete: [],
      abandoned: [],
    });
  });
});
