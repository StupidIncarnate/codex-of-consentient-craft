import { autoResumableQuestStatusesStatics } from './auto-resumable-quest-statuses-statics';

describe('autoResumableQuestStatusesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(autoResumableQuestStatusesStatics).toStrictEqual(['in_progress']);
  });
});
