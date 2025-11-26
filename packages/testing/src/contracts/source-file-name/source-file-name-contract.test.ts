import { sourceFileNameContract } from './source-file-name-contract';
import { SourceFileNameStub } from './source-file-name.stub';

describe('sourceFileNameContract', () => {
  describe('valid source file names', () => {
    it('VALID: "test.ts" => parses successfully', () => {
      const fileName = SourceFileNameStub({ value: 'test.ts' });

      const result = sourceFileNameContract.parse(fileName);

      expect(result).toBe('test.ts');
    });

    it('VALID: "example.test.ts" => parses successfully', () => {
      const fileName = SourceFileNameStub({ value: 'example.test.ts' });

      const result = sourceFileNameContract.parse(fileName);

      expect(result).toBe('example.test.ts');
    });

    it('VALID: "adapter.proxy.ts" => parses successfully', () => {
      const fileName = SourceFileNameStub({ value: 'adapter.proxy.ts' });

      const result = sourceFileNameContract.parse(fileName);

      expect(result).toBe('adapter.proxy.ts');
    });
  });

  describe('invalid source file names', () => {
    it('INVALID_EMPTY: "" => throws validation error', () => {
      expect(() => {
        return sourceFileNameContract.parse('');
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_TYPE: null => throws validation error', () => {
      expect(() => {
        return sourceFileNameContract.parse(null);
      }).toThrow(/Expected string/u);
    });
  });
});
