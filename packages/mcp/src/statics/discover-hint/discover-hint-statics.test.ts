import { discoverHintStatics } from './discover-hint-statics';

describe('discoverHintStatics', () => {
  it('VALID: exported statics => matches exact expected shape', () => {
    expect(discoverHintStatics).toStrictEqual({
      maxDirectoriesShown: 10,
      header: '(no files matched)',
      explanation: 'Hint: your glob matched these directories but discover returns files only.',
      suggestion: 'Try appending "/**" to descend into them:',
      grepNoMatchHeader: '(no content matches)',
      grepNoMatchExplanation:
        'Your glob matched files, but your grep pattern did not match any content.',
    });
  });
});
