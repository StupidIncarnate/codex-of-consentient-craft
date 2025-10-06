import { isTestFileGuard } from './is-test-file-guard';

describe('isTestFileGuard', () => {
  describe('valid test files', () => {
    it('VALID: {filename: "user-broker.test.ts"} => true', () => {
      const result = isTestFileGuard({ filename: 'user-broker.test.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "user-widget.test.tsx"} => true', () => {
      const result = isTestFileGuard({ filename: 'user-widget.test.tsx' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "user-broker.spec.ts"} => true', () => {
      const result = isTestFileGuard({ filename: 'user-broker.spec.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "user-broker.integration.test.ts"} => true', () => {
      const result = isTestFileGuard({ filename: 'user-broker.integration.test.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "user-broker.integration.spec.tsx"} => true', () => {
      const result = isTestFileGuard({ filename: 'user-broker.integration.spec.tsx' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "user-broker.e2e.test.ts"} => true', () => {
      const result = isTestFileGuard({ filename: 'user-broker.e2e.test.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/path/to/user-broker.e2e.spec.ts"} => true', () => {
      const result = isTestFileGuard({ filename: '/path/to/user-broker.e2e.spec.ts' });

      expect(result).toBe(true);
    });
  });

  describe('non-test files', () => {
    it('VALID: {filename: "user-broker.ts"} => false', () => {
      const result = isTestFileGuard({ filename: 'user-broker.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "user-widget.tsx"} => false', () => {
      const result = isTestFileGuard({ filename: 'user-widget.tsx' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "user.stub.ts"} => false', () => {
      const result = isTestFileGuard({ filename: 'user.stub.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "user.d.ts"} => false', () => {
      const result = isTestFileGuard({ filename: 'user.d.ts' });

      expect(result).toBe(false);
    });
  });
});
