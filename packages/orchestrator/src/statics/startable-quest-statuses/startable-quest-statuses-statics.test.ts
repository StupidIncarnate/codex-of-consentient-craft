import { startableQuestStatusesStatics } from './startable-quest-statuses-statics';

describe('startableQuestStatusesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(startableQuestStatusesStatics).toStrictEqual(['approved', 'design_approved']);
  });
});
