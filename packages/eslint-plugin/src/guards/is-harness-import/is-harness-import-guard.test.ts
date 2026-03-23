import { isHarnessImportGuard } from './is-harness-import-guard';

describe('isHarnessImportGuard', () => {
  describe('valid harness imports', () => {
    it('VALID: {importSource: "./guild.harness"} => returns true', () => {
      const result = isHarnessImportGuard({ importSource: './guild.harness' });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "./guild.harness.ts"} => returns true', () => {
      const result = isHarnessImportGuard({ importSource: './guild.harness.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "../test/harnesses/guild/guild.harness"} => returns true', () => {
      const result = isHarnessImportGuard({
        importSource: '../test/harnesses/guild/guild.harness',
      });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "../../test/harnesses/claude-mock.harness/"} => returns true', () => {
      const result = isHarnessImportGuard({
        importSource: '../../test/harnesses/claude-mock.harness/',
      });

      expect(result).toBe(true);
    });
  });

  describe('scoped package harness imports', () => {
    it('VALID: {importSource: "@dungeonmaster/testing/test/harnesses/quest/quest.harness"} => returns true', () => {
      const result = isHarnessImportGuard({
        importSource: '@dungeonmaster/testing/test/harnesses/quest/quest.harness',
      });

      expect(result).toBe(true);
    });

    it('VALID: {importSource: "@my-org/test-utils/test/harnesses/guild/guild.harness"} => returns true', () => {
      const result = isHarnessImportGuard({
        importSource: '@my-org/test-utils/test/harnesses/guild/guild.harness',
      });

      expect(result).toBe(true);
    });
  });

  describe('non-harness imports', () => {
    it('VALID: {importSource: "./guild-broker"} => returns false', () => {
      const result = isHarnessImportGuard({ importSource: './guild-broker' });

      expect(result).toBe(false);
    });

    it('VALID: {importSource: "./guild-broker.proxy"} => returns false', () => {
      const result = isHarnessImportGuard({ importSource: './guild-broker.proxy' });

      expect(result).toBe(false);
    });

    it('VALID: {importSource: "./guild.stub.ts"} => returns false', () => {
      const result = isHarnessImportGuard({ importSource: './guild.stub.ts' });

      expect(result).toBe(false);
    });

    it('VALID: {importSource: "axios"} => returns false', () => {
      const result = isHarnessImportGuard({ importSource: 'axios' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {importSource: ""} => returns false', () => {
      const result = isHarnessImportGuard({ importSource: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      const result = isHarnessImportGuard({});

      expect(result).toBe(false);
    });
  });
});
