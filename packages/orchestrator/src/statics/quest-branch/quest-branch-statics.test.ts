import { questBranchStatics } from './quest-branch-statics';

describe('questBranchStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questBranchStatics).toStrictEqual({
      branchPrefix: 'quest/',
      questIdSuffixLength: 8,
      slugMaxLength: 48,
      fallbackSlug: 'quest',
    });
  });
});
