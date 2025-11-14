import { filePathContract } from './file-path-contract';
import { FilePathStub } from './file-path.stub';

describe('filePathContract', () => {
  describe('valid file paths', () => {
    it('VALID: "/path/to/file.ts" => parses successfully', () => {
      const path = filePathContract.parse('/path/to/file.ts');

      expect(path).toBe('/path/to/file.ts');
    });

    it('VALID: "relative/path.ts" => parses successfully', () => {
      const path = filePathContract.parse('relative/path.ts');

      expect(path).toBe('relative/path.ts');
    });

    it('VALID: stub with default => parses with default value', () => {
      const path = FilePathStub();

      const result = filePathContract.parse(path);

      expect(result).toBe('/test/file.ts');
    });

    it('VALID: stub with override => parses with custom value', () => {
      const path = FilePathStub({ value: '/custom/path.ts' });

      const result = filePathContract.parse(path);

      expect(result).toBe('/custom/path.ts');
    });
  });

  describe('invalid file paths', () => {
    it('INVALID_EMPTY: "" => throws validation error', () => {
      expect(() => {
        return filePathContract.parse('');
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_TYPE: 123 => throws validation error', () => {
      expect(() => {
        return filePathContract.parse(123);
      }).toThrow(/Expected string/u);
    });

    it('INVALID_UNDEFINED: undefined => throws validation error', () => {
      expect(() => {
        return filePathContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
