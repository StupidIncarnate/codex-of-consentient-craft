import { isProxyImportGuard } from './is-proxy-import-guard';

describe('isProxyImportGuard', () => {
  describe('valid proxy imports', () => {
    it('VALID: {importSource: "./user-broker.proxy"} => returns true', () => {
      const result = isProxyImportGuard({ importSource: './user-broker.proxy' });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "./user-broker.proxy.ts"} => returns true', () => {
      const result = isProxyImportGuard({ importSource: './user-broker.proxy.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "./user-broker.proxy.tsx"} => returns true', () => {
      const result = isProxyImportGuard({ importSource: './user-broker.proxy.tsx' });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "../adapters/http.proxy"} => returns true', () => {
      const result = isProxyImportGuard({ importSource: '../adapters/http.proxy' });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "../../brokers/user.proxy/"} => returns true', () => {
      const result = isProxyImportGuard({ importSource: '../../brokers/user.proxy/' });

      expect(result).toBe(true);
    });
  });

  describe('non-proxy imports', () => {
    it('VALID: {importSource: "./user-broker"} => returns false', () => {
      const result = isProxyImportGuard({ importSource: './user-broker' });

      expect(result).toBe(false);
    });

    it('VALID: {importSource: "./user-broker.ts"} => returns false', () => {
      const result = isProxyImportGuard({ importSource: './user-broker.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {importSource: "./user-contract.stub.ts"} => returns false', () => {
      const result = isProxyImportGuard({ importSource: './user-contract.stub.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {importSource: "axios"} => returns false', () => {
      const result = isProxyImportGuard({ importSource: 'axios' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {importSource: ""} => returns false', () => {
      const result = isProxyImportGuard({ importSource: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      const result = isProxyImportGuard({});

      expect(result).toBe(false);
    });
  });
});
