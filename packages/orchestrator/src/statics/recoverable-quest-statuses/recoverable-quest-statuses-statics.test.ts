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
      'in_progress',
    ]);
  });
});
