import { smoketestPlaceholdersStatics } from './smoketest-placeholders-statics';

describe('smoketestPlaceholdersStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(smoketestPlaceholdersStatics).toStrictEqual({
      questId: '{{questId}}',
      guildId: '{{guildId}}',
      processId: '{{processId}}',
      workItemId: '{{workItemId}}',
    });
  });
});
