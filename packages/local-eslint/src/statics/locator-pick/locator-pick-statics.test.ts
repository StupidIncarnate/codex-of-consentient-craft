import { locatorPickStatics } from './locator-pick-statics';

describe('locatorPickStatics', () => {
  describe('scope', () => {
    it('VALID: inScopePathSubstring => equals the step-command broker implementations path', () => {
      expect(locatorPickStatics.scope.inScopePathSubstring).toBe(
        'packages/siegelense/src/brokers/step/',
      );
    });
  });

  describe('bannedMethodNames', () => {
    it('VALID: always => equals the two always-banned locator methods', () => {
      expect(locatorPickStatics.bannedMethodNames.always).toStrictEqual(['first', 'last']);
    });

    it('VALID: conditional => equals the literal-argument-only banned method name', () => {
      expect(locatorPickStatics.bannedMethodNames.conditional).toBe('nth');
    });
  });
});
