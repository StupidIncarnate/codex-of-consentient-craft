import { shouldExcludeFileFromProjectStructureRulesGuard } from './should-exclude-file-from-project-structure-rules-guard';

describe('shouldExcludeFileFromProjectStructureRulesGuard', () => {
  describe('files with multiple dots', () => {
    it('VALID: {filename: "/project/src/user.test.ts"} => returns true', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({ filename: '/project/src/user.test.ts' }),
      ).toBe(true);
    });

    it('VALID: {filename: "/project/src/user.stub.ts"} => returns true', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({ filename: '/project/src/user.stub.ts' }),
      ).toBe(true);
    });

    it('VALID: {filename: "/project/src/types.d.ts"} => returns true', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({ filename: '/project/src/types.d.ts' }),
      ).toBe(true);
    });

    it('VALID: {filename: "/project/src/user.integration.test.ts"} => returns true', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({
          filename: '/project/src/user.integration.test.ts',
        }),
      ).toBe(true);
    });
  });

  describe('files not in /src/', () => {
    it('VALID: {filename: "/project/lib/utils.ts"} => returns true', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({ filename: '/project/lib/utils.ts' }),
      ).toBe(true);
    });

    it('VALID: {filename: "/project/test/helper.ts"} => returns true', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({ filename: '/project/test/helper.ts' }),
      ).toBe(true);
    });

    it('VALID: {filename: "utils.ts"} => returns true', () => {
      expect(shouldExcludeFileFromProjectStructureRulesGuard({ filename: 'utils.ts' })).toBe(true);
    });
  });

  describe('files directly in /src/', () => {
    it('VALID: {filename: "/project/src/index.ts"} => returns true', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({ filename: '/project/src/index.ts' }),
      ).toBe(true);
    });

    it('VALID: {filename: "/project/src/main.ts"} => returns true', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({ filename: '/project/src/main.ts' }),
      ).toBe(true);
    });
  });

  describe('files that should NOT be excluded', () => {
    it('INVALID: {filename: "/project/src/brokers/user/user-broker.ts"} => returns false', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({
          filename: '/project/src/brokers/user/user-broker.ts',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: "/project/src/contracts/user/user-contract.ts"} => returns false', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({
          filename: '/project/src/contracts/user/user-contract.ts',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: "/project/src/guards/auth/auth-guard.ts"} => returns false', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({
          filename: '/project/src/guards/auth/auth-guard.ts',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: "/project/src/adapters/http/http-adapter.proxy.ts"} => returns false', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({
          filename: '/project/src/adapters/http/http-adapter.proxy.ts',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: "/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts"} => returns false', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({
          filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: "/project/src/guards/has-permission/has-permission-guard.proxy.ts"} => returns false', () => {
      expect(
        shouldExcludeFileFromProjectStructureRulesGuard({
          filename: '/project/src/guards/has-permission/has-permission-guard.proxy.ts',
        }),
      ).toBe(false);
    });
  });

  describe('optional parameters', () => {
    it('EMPTY: {filename: undefined} => returns true', () => {
      expect(shouldExcludeFileFromProjectStructureRulesGuard({ filename: undefined })).toBe(true);
    });

    it('EMPTY: {} => returns true', () => {
      expect(shouldExcludeFileFromProjectStructureRulesGuard({})).toBe(true);
    });
  });
});
