import { isE2eTestPathGuard } from './is-e2e-test-path-guard';

describe('isE2eTestPathGuard', () => {
  describe('valid e2e paths', () => {
    it('VALID: {e2e/web/smoke.spec.ts} => returns true', () => {
      const result = isE2eTestPathGuard({ filePath: 'e2e/web/smoke.spec.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {tests/e2e/login.spec.ts} => returns true', () => {
      const result = isE2eTestPathGuard({ filePath: 'tests/e2e/login.spec.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {e2e/chat.spec.ts} => returns true', () => {
      const result = isE2eTestPathGuard({ filePath: 'e2e/chat.spec.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {packages/testing/e2e/web/smoke.spec.ts} => returns true', () => {
      const result = isE2eTestPathGuard({ filePath: 'packages/testing/e2e/web/smoke.spec.ts' });

      expect(result).toBe(true);
    });
  });

  describe('non-e2e paths', () => {
    it('INVALID: {unit test file} => returns false', () => {
      const result = isE2eTestPathGuard({ filePath: 'src/foo.test.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {integration test file} => returns false', () => {
      const result = isE2eTestPathGuard({ filePath: 'src/foo.integration.test.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {source file} => returns false', () => {
      const result = isE2eTestPathGuard({ filePath: 'src/brokers/user/user-broker.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {spec.ts outside e2e folder} => returns false', () => {
      const result = isE2eTestPathGuard({ filePath: 'src/smoke.spec.ts' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {filePath: undefined} => returns false', () => {
      const result = isE2eTestPathGuard({});

      expect(result).toBe(false);
    });
  });
});
