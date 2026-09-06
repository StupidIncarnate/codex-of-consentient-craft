import { gitignoreEntriesStatics } from './gitignore-entries-statics';

describe('gitignoreEntriesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(gitignoreEntriesStatics).toStrictEqual({
      entries: ['.ward/', 'test-results/', '.ward-playwright-report*.json'],
    });
  });
});
