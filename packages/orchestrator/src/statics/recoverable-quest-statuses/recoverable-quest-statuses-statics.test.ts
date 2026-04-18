import { recoverableQuestStatusesStatics } from './recoverable-quest-statuses-statics';

describe('recoverableQuestStatusesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(recoverableQuestStatusesStatics).toStrictEqual([
      'created',
      'pending',
      'explore_flows',
      'flows_approved',
      'explore_observables',
      'explore_design',
      'seek_scope',
      'seek_synth',
      'seek_walk',
      'seek_plan',
      'in_progress',
    ]);
  });
});
