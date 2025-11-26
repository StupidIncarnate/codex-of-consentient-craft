import { isProxyImportGuard } from './is-proxy-import-guard';

describe('isProxyImportGuard', () => {
  describe('valid proxy imports', () => {
    it('VALID: {importPath: "./test.proxy"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: './test.proxy' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "../adapter/http.proxy"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: '../adapter/http.proxy' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "./path/to/file.proxy.ts"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: './path/to/file.proxy.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "../../broker/user-fetch-broker.proxy"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: '../../broker/user-fetch-broker.proxy' });

      expect(result).toBe(true);
    });
  });

  describe('non-proxy imports', () => {
    it('INVALID: {importPath: "./test.ts"} => returns false', () => {
      const result = isProxyImportGuard({ importPath: './test.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {importPath: "../adapter/http-adapter"} => returns false', () => {
      const result = isProxyImportGuard({ importPath: '../adapter/http-adapter' });

      expect(result).toBe(false);
    });

    it('INVALID: {importPath: "./test.test.ts"} => returns false', () => {
      const result = isProxyImportGuard({ importPath: './test.test.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {importPath: "axios"} => returns false', () => {
      const result = isProxyImportGuard({ importPath: 'axios' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {importPath: undefined} => returns false', () => {
      const result = isProxyImportGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {importPath: ""} => returns false', () => {
      const result = isProxyImportGuard({ importPath: '' });

      expect(result).toBe(false);
    });
  });
});
