import { questTransitionTargetStatusesStatics } from './quest-transition-target-statuses-statics';

describe('questTransitionTargetStatusesStatics', () => {
  it('VALID: exported value => matches the nine askable quest statuses in declared order', () => {
    expect(questTransitionTargetStatusesStatics.value).toStrictEqual([
      'explore_flows',
      'review_flows',
      'flows_approved',
      'explore_observables',
      'review_observables',
      'approved',
      'in_progress',
      'complete',
      'abandoned',
    ]);
  });
});
