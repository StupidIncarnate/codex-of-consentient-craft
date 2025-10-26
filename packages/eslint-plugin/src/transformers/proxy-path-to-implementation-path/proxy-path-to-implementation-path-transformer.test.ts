import { proxyPathToImplementationPathTransformer } from './proxy-path-to-implementation-path-transformer';

describe('proxyPathToImplementationPathTransformer', () => {
  describe('converting proxy path to implementation path', () => {
    it('VALID: {proxyPath: "user-broker.proxy.ts"} => returns "user-broker.ts"', () => {
      const result = proxyPathToImplementationPathTransformer({
        proxyPath: 'user-broker.proxy.ts',
      });

      expect(result).toBe('user-broker.ts');
    });

    it('VALID: {proxyPath: "/path/to/http-adapter.proxy.ts"} => returns "/path/to/http-adapter.ts"', () => {
      const result = proxyPathToImplementationPathTransformer({
        proxyPath: '/path/to/http-adapter.proxy.ts',
      });

      expect(result).toBe('/path/to/http-adapter.ts');
    });

    it('VALID: {proxyPath: "./user-fetch-broker.proxy.ts"} => returns "./user-fetch-broker.ts"', () => {
      const result = proxyPathToImplementationPathTransformer({
        proxyPath: './user-fetch-broker.proxy.ts',
      });

      expect(result).toBe('./user-fetch-broker.ts');
    });
  });

  describe('edge cases', () => {
    it('VALID: {proxyPath: "file.ts"} => returns "file.ts"', () => {
      const result = proxyPathToImplementationPathTransformer({ proxyPath: 'file.ts' });

      expect(result).toBe('file.ts');
    });

    it('VALID: {proxyPath: "file.proxy.proxy.ts"} => returns "file.proxy.ts"', () => {
      const result = proxyPathToImplementationPathTransformer({
        proxyPath: 'file.proxy.proxy.ts',
      });

      expect(result).toBe('file.proxy.ts');
    });

    it('VALID: {proxyPath: ".proxy.ts"} => returns ".ts"', () => {
      const result = proxyPathToImplementationPathTransformer({ proxyPath: '.proxy.ts' });

      expect(result).toBe('.ts');
    });
  });
});
