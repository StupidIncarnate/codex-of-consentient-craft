import { roleToModelStatics } from './role-to-model-statics';

describe('roleToModelStatics', () => {
  it('VALID: exports exact role→model mapping', () => {
    expect(roleToModelStatics).toStrictEqual({
      chaoswhisperer: 'opus',
      glyphsmith: 'opus',
      pathseeker: 'opus',
      'pathseeker-surface': 'sonnet',
      'pathseeker-dedup': 'sonnet',
      'pathseeker-assertion-correctness': 'sonnet',
      'pathseeker-walk': 'opus',
      siegemaster: 'opus',
      codeweaver: 'sonnet',
      spiritmender: 'sonnet',
      lawbringer: 'sonnet',
      blightwarden: 'sonnet',
      pesteater: 'opus',
    });
  });
});
