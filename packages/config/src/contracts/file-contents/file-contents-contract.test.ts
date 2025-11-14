import { fileContentsContract } from './file-contents-contract';
import { FileContentsStub } from './file-contents.stub';

describe('fileContentsContract', () => {
  describe('valid file contents', () => {
    it('VALID: "test content" => parses successfully', () => {
      const contents = fileContentsContract.parse('test content');

      expect(contents).toBe('test content');
    });

    it('VALID: empty string => parses successfully', () => {
      const contents = fileContentsContract.parse('');

      expect(contents).toBe('');
    });

    it('VALID: stub with default => parses with default value', () => {
      const contents = FileContentsStub();

      const result = fileContentsContract.parse(contents);

      expect(result).toBe('test file contents');
    });

    it('VALID: stub with override => parses with custom value', () => {
      const contents = FileContentsStub({ value: 'custom contents' });

      const result = fileContentsContract.parse(contents);

      expect(result).toBe('custom contents');
    });
  });

  describe('invalid file contents', () => {
    it('INVALID_TYPE: 123 => throws validation error', () => {
      expect(() => {
        return fileContentsContract.parse(123);
      }).toThrow(/Expected string/u);
    });

    it('INVALID_UNDEFINED: undefined => throws validation error', () => {
      expect(() => {
        return fileContentsContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
