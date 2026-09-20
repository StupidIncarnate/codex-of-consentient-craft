import { isLocatorPickScopeFileGuard } from './is-locator-pick-scope-file-guard';

describe('isLocatorPickScopeFileGuard', () => {
  describe('in-scope paths', () => {
    it('VALID: {filename: a step-command broker} => returns true', () => {
      expect(
        isLocatorPickScopeFileGuard({
          filename: '/repo/packages/siegelense/src/brokers/step/click/step-click-broker.ts',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: a step-command broker test file} => returns true', () => {
      expect(
        isLocatorPickScopeFileGuard({
          filename:
            '/repo/packages/siegelense/src/brokers/step/target-resolve/step-target-resolve-broker.test.ts',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: windows separators on a step-command broker} => returns true', () => {
      expect(
        isLocatorPickScopeFileGuard({
          filename:
            'C:\\repo\\packages\\siegelense\\src\\brokers\\step\\click\\step-click-broker.ts',
        }),
      ).toBe(true);
    });
  });

  describe('out-of-scope paths', () => {
    it('VALID: {filename: the playwright session adapter} => returns false', () => {
      expect(
        isLocatorPickScopeFileGuard({
          filename:
            '/repo/packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts',
        }),
      ).toBe(false);
    });

    it('VALID: {filename: a different package broker} => returns false', () => {
      expect(
        isLocatorPickScopeFileGuard({
          filename: '/repo/packages/shared/src/brokers/foo/foo-broker.ts',
        }),
      ).toBe(false);
    });

    it('VALID: {filename: a siegelense broker outside brokers/step} => returns false', () => {
      expect(
        isLocatorPickScopeFileGuard({
          filename: '/repo/packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts',
        }),
      ).toBe(false);
    });
  });

  describe('missing filename', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isLocatorPickScopeFileGuard({})).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      expect(isLocatorPickScopeFileGuard({ filename: '' })).toBe(false);
    });
  });
});
