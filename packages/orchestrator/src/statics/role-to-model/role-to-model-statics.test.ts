import { roleToModelStatics } from './role-to-model-statics';

describe('roleToModelStatics', () => {
  it('VALID: exports exact role→model mapping', () => {
    expect(roleToModelStatics).toStrictEqual({
      chaoswhisperer: 'opus',
      glyphsmith: 'opus',
      bughunt: 'opus',
      flowrider: 'opus',
      siegemaster: 'opus',
      codeweaver: 'opus',
      spiritmender: 'sonnet',
      'blightwarden-group-minion': 'sonnet',
      'blightwarden-crosscut-minion': 'sonnet',
      blightwarden: 'sonnet',
      pesteater: 'opus',
    });
  });
});
