import { roleToModelStatics } from './role-to-model-statics';

describe('roleToModelStatics', () => {
  it('VALID: exports exact role→model mapping', () => {
    expect(roleToModelStatics).toStrictEqual({
      chaoswhisperer: 'opus',
      glyphsmith: 'opus',
      bughunt: 'opus',
      tavernkeeper: 'opus',
      flowrider: 'opus',
      groundstomper: 'opus',
      siegemaster: 'opus',
      codeweaver: 'opus',
      spiritmender: 'sonnet',
      pesteater: 'opus',
      warpgate: 'opus',
    });
  });
});
