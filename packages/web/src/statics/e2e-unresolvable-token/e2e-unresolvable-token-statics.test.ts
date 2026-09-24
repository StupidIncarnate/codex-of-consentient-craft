import { e2eUnresolvableTokenStatics } from './e2e-unresolvable-token-statics';

describe('e2eUnresolvableTokenStatics', () => {
  describe('tokens.all', () => {
    it('VALID: {} => names the two workspace tokens playwright.config.ts cannot resolve', () => {
      expect(e2eUnresolvableTokenStatics.tokens.all).toStrictEqual([
        '{apiWorkspace}',
        '{webWorkspace}',
      ]);
    });
  });
});
