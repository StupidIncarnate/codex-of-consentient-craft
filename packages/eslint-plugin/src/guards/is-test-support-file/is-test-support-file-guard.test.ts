import { isTestSupportFileGuard } from './is-test-support-file-guard';

describe('isTestSupportFileGuard', () => {
  describe('test support files', () => {
    it('VALID: {filename: "/p/src/brokers/x/x-broker.test.ts"} => returns true', () => {
      const result = isTestSupportFileGuard({ filename: '/p/src/brokers/x/x-broker.test.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/p/src/brokers/x/x-broker.integration.test.ts"} => returns true', () => {
      const result = isTestSupportFileGuard({
        filename: '/p/src/brokers/x/x-broker.integration.test.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/p/src/brokers/x/x-broker.proxy.ts"} => returns true', () => {
      const result = isTestSupportFileGuard({ filename: '/p/src/brokers/x/x-broker.proxy.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/p/src/widgets/x/x-widget.proxy.tsx"} => returns true', () => {
      const result = isTestSupportFileGuard({ filename: '/p/src/widgets/x/x-widget.proxy.tsx' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/p/src/contracts/x/x.stub.ts"} => returns true', () => {
      const result = isTestSupportFileGuard({ filename: '/p/src/contracts/x/x.stub.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/p/test/harnesses/x/x.harness.ts"} => returns true', () => {
      const result = isTestSupportFileGuard({ filename: '/p/test/harnesses/x/x.harness.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/p/test/setup.ts"} => returns true', () => {
      const result = isTestSupportFileGuard({ filename: '/p/test/setup.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/p/e2e/x.e2e.ts"} => returns true', () => {
      const result = isTestSupportFileGuard({ filename: '/p/e2e/x.e2e.ts' });

      expect(result).toBe(true);
    });
  });

  describe('production files', () => {
    it('VALID: {filename: "/p/src/brokers/x/x-broker.ts"} => returns false', () => {
      const result = isTestSupportFileGuard({ filename: '/p/src/brokers/x/x-broker.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "/p/src/contracts/contracts.ts"} => returns false', () => {
      const result = isTestSupportFileGuard({ filename: '/p/src/contracts/contracts.ts' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns false', () => {
      const result = isTestSupportFileGuard({});

      expect(result).toBe(false);
    });
  });
});
