import { isStubOrProxyImportGuard } from './is-stub-or-proxy-import-guard';

describe('isStubOrProxyImportGuard', () => {
  describe('stub and proxy specifiers', () => {
    it('VALID: {importSource: "./quest.stub"} => returns true', () => {
      const result = isStubOrProxyImportGuard({ importSource: './quest.stub' });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "../x/x-broker.proxy.ts"} => returns true', () => {
      const result = isStubOrProxyImportGuard({ importSource: '../x/x-broker.proxy.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "@dungeonmaster/shared/contracts/quest/quest.stub"} => returns true', () => {
      const result = isStubOrProxyImportGuard({
        importSource: '@dungeonmaster/shared/contracts/quest/quest.stub',
      });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "#gateway/node/fs/read-file/read-file.proxy"} => returns true', () => {
      const result = isStubOrProxyImportGuard({
        importSource: '#gateway/node/fs/read-file/read-file.proxy',
      });

      expect(result).toBe(true);
    });
  });

  describe('other specifiers', () => {
    it('VALID: {importSource: "@dungeonmaster/shared/contracts"} => returns false', () => {
      const result = isStubOrProxyImportGuard({ importSource: '@dungeonmaster/shared/contracts' });

      expect(result).toBe(false);
    });

    it('VALID: {importSource: "./quest-contract"} => returns false', () => {
      const result = isStubOrProxyImportGuard({ importSource: './quest-contract' });

      expect(result).toBe(false);
    });

    it('VALID: {importSource: "./stubbed-thing"} => returns false', () => {
      const result = isStubOrProxyImportGuard({ importSource: './stubbed-thing' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns false', () => {
      const result = isStubOrProxyImportGuard({});

      expect(result).toBe(false);
    });
  });
});
