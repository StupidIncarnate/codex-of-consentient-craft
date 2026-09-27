import { gatewayCallerPackageNameTransformer } from './gateway-caller-package-name-transformer';

describe('gatewayCallerPackageNameTransformer', () => {
  describe('an ordinary workspace package', () => {
    it('VALID: {filename: under packages/<name>} => returns the package folder name', () => {
      const result = gatewayCallerPackageNameTransformer({
        filename: '/repo/packages/orchestrator/src/brokers/x/x-broker.ts',
      });

      expect(result).toBe('orchestrator');
    });
  });

  describe('a gateway package', () => {
    it('VALID: {filename: under packages/@gateway/<name>} => returns the gateway folder name', () => {
      const result = gatewayCallerPackageNameTransformer({
        filename: '/repo/packages/@gateway/node/src/fs/fs.ts',
      });

      expect(result).toBe('node');
    });
  });

  describe('no packages segment in the path', () => {
    it('EMPTY: {filename: no "packages" segment} => returns undefined', () => {
      const result = gatewayCallerPackageNameTransformer({
        filename: '/repo/scripts/build.ts',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('packages segment with nothing after it', () => {
    it('EMPTY: {filename: "packages" is the last segment} => returns undefined', () => {
      const result = gatewayCallerPackageNameTransformer({ filename: '/repo/packages' });

      expect(result).toBe(undefined);
    });
  });

  describe('@gateway segment with nothing after it', () => {
    it('EMPTY: {filename: "packages/@gateway" with nothing after} => returns undefined', () => {
      const result = gatewayCallerPackageNameTransformer({ filename: '/repo/packages/@gateway' });

      expect(result).toBe(undefined);
    });
  });
});
