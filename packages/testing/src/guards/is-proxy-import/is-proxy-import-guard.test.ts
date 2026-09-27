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

    it('VALID: {importPath: "@dungeonmaster/shared/testing"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: '@dungeonmaster/shared/testing' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "@dungeonmaster/bin/testing"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: '@dungeonmaster/bin/testing' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "@dungeonmaster/node/testing"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: '@dungeonmaster/node/testing' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "@dungeonmaster/npm/testing"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: '@dungeonmaster/npm/testing' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "@dungeonmaster/browser/testing"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: '@dungeonmaster/browser/testing' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "some-unscoped-package/testing"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: 'some-unscoped-package/testing' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "#foo/bar/testing"} => returns true', () => {
      const result = isProxyImportGuard({ importPath: '#foo/bar/testing' });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy"} => returns true', () => {
      const result = isProxyImportGuard({
        importPath: '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy',
      });

      expect(result).toBe(true);
    });

    it('VALID: {importPath: "@dungeonmaster/node/fs/is-fs-error/is-fs-error.proxy"} => returns true', () => {
      const result = isProxyImportGuard({
        importPath: '@dungeonmaster/node/fs/is-fs-error/is-fs-error.proxy',
      });

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

    it('INVALID: {importPath: "@testing-library/react"} => returns false', () => {
      const result = isProxyImportGuard({ importPath: '@testing-library/react' });

      expect(result).toBe(false);
    });

    it('INVALID: {importPath: "@dungeonmaster/bin/git"} => returns false', () => {
      const result = isProxyImportGuard({ importPath: '@dungeonmaster/bin/git' });

      expect(result).toBe(false);
    });

    it('INVALID: {importPath: "#gateway/npm/glob"} => returns false', () => {
      const result = isProxyImportGuard({ importPath: '#gateway/npm/glob' });

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
