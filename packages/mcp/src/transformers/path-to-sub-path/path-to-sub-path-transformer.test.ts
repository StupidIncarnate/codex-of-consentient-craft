import { pathToSubPathTransformer } from './path-to-sub-path-transformer';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('pathToSubPathTransformer', () => {
  describe('src anchor', () => {
    it('VALID: {filepath: "packages/orchestrator/src/contracts"} => returns "src/contracts"', () => {
      const result = pathToSubPathTransformer({
        filepath: FilePathStub({ value: 'packages/orchestrator/src/contracts' }),
      });

      expect(result).toBe('src/contracts');
    });

    it('VALID: {filepath: "packages/mcp/src/brokers/file/scanner"} => returns "src/brokers/file/scanner"', () => {
      const result = pathToSubPathTransformer({
        filepath: FilePathStub({ value: 'packages/mcp/src/brokers/file/scanner' }),
      });

      expect(result).toBe('src/brokers/file/scanner');
    });

    it('VALID: {filepath: "src/guards"} => returns "src/guards"', () => {
      const result = pathToSubPathTransformer({
        filepath: FilePathStub({ value: 'src/guards' }),
      });

      expect(result).toBe('src/guards');
    });
  });

  describe('test anchor', () => {
    it('VALID: {filepath: "packages/orchestrator/test/harnesses"} => returns "test/harnesses"', () => {
      const result = pathToSubPathTransformer({
        filepath: FilePathStub({ value: 'packages/orchestrator/test/harnesses' }),
      });

      expect(result).toBe('test/harnesses');
    });

    it('VALID: {filepath: "test/harnesses/lifecycle-verify"} => returns "test/harnesses/lifecycle-verify"', () => {
      const result = pathToSubPathTransformer({
        filepath: FilePathStub({ value: 'test/harnesses/lifecycle-verify' }),
      });

      expect(result).toBe('test/harnesses/lifecycle-verify');
    });
  });

  describe('no anchor found', () => {
    it('EMPTY: {filepath: "packages/orchestrator/lib/utils"} => returns null', () => {
      const result = pathToSubPathTransformer({
        filepath: FilePathStub({ value: 'packages/orchestrator/lib/utils' }),
      });

      expect(result).toBeNull();
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {filepath: undefined} => returns null', () => {
      const result = pathToSubPathTransformer({});

      expect(result).toBeNull();
    });
  });
});
