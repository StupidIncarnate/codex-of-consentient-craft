import { roleToModelStatics } from './role-to-model-statics';

describe('roleToModelStatics', () => {
  it('VALID: exports exact role→model mapping', () => {
    expect(roleToModelStatics).toStrictEqual({
      chaoswhisperer: 'opus',
      glyphsmith: 'opus',
      flowrider: 'opus',
      siegemaster: 'opus',
      codeweaver: 'opus',
      spiritmender: 'sonnet',
      lawbringer: 'sonnet',
      'blightwarden-security-minion': 'sonnet',
      'blightwarden-dedup-minion': 'sonnet',
      'blightwarden-perf-minion': 'sonnet',
      'blightwarden-integrity-minion': 'sonnet',
      'blightwarden-dead-code-minion': 'sonnet',
      blightwarden: 'sonnet',
      pesteater: 'opus',
    });
  });
});
