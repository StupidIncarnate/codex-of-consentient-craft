import { isPackageNameLiteralAllowlistedGuard } from './is-package-name-literal-allowlisted-guard';

describe('isPackageNameLiteralAllowlistedGuard', () => {
  describe('allowlisted paths', () => {
    it('VALID: {filename: rule-owned local-eslint source} => returns true', () => {
      expect(
        isPackageNameLiteralAllowlistedGuard({
          filename:
            '/repo/packages/local-eslint/src/statics/package-name-literal/package-name-literal-statics.ts',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: .test.ts} => returns true', () => {
      expect(
        isPackageNameLiteralAllowlistedGuard({
          filename: '/repo/packages/shared/src/brokers/foo/foo-broker.test.ts',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: .stub.ts} => returns true', () => {
      expect(
        isPackageNameLiteralAllowlistedGuard({
          filename: '/repo/packages/shared/src/contracts/foo/foo.stub.ts',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: .proxy.ts} => returns true', () => {
      expect(
        isPackageNameLiteralAllowlistedGuard({
          filename: '/repo/packages/shared/src/brokers/foo/foo-broker.proxy.ts',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: .harness.ts} => returns true', () => {
      expect(
        isPackageNameLiteralAllowlistedGuard({
          filename: '/repo/packages/web/test/harnesses/quest/quest.harness.ts',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: windows separators on rule-owned source} => returns true', () => {
      expect(
        isPackageNameLiteralAllowlistedGuard({
          filename: 'C:\\repo\\packages\\local-eslint\\src\\index.ts',
        }),
      ).toBe(true);
    });
  });

  describe('non-allowlisted paths', () => {
    it('VALID: {filename: production broker} => returns false', () => {
      expect(
        isPackageNameLiteralAllowlistedGuard({
          filename: '/repo/packages/shared/src/brokers/foo/foo-broker.ts',
        }),
      ).toBe(false);
    });

    it('VALID: {filename: prompt statics} => returns false', () => {
      expect(
        isPackageNameLiteralAllowlistedGuard({
          filename: '/repo/packages/orchestrator/src/statics/foo-prompt/foo-prompt-statics.ts',
        }),
      ).toBe(false);
    });
  });

  describe('missing filename', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isPackageNameLiteralAllowlistedGuard({})).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      expect(isPackageNameLiteralAllowlistedGuard({ filename: '' })).toBe(false);
    });
  });
});
