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
      approved: ['seek_scope', 'explore_design'],
      explore_design: ['review_design'],
      review_design: ['design_approved', 'explore_design'],
      design_approved: ['seek_scope', 'explore_design'],
      seek_scope: ['seek_synth', 'abandoned'],
      seek_synth: ['seek_walk', 'seek_scope', 'abandoned'],
      seek_walk: ['seek_plan', 'seek_scope', 'abandoned'],
      seek_plan: ['in_progress', 'seek_walk', 'abandoned'],
      in_progress: [
        'in_progress',
        'paused',
        'blocked',
        'complete',
        'abandoned',
        'seek_walk',
        'seek_scope',
      ],
      paused: ['in_progress', 'abandoned'],
      blocked: ['in_progress', 'abandoned'],
      complete: [],
      abandoned: [],
    });
  });
});
