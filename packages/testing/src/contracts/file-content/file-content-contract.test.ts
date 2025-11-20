import { fileContentContract } from './file-content-contract';
import { FileContentStub } from './file-content.stub';

describe('fileContentContract', () => {
  describe('valid file content', () => {
    it('VALID: {value: "test content"} => parses successfully', () => {
      const content = FileContentStub({ value: 'test content' });

      const parsed = fileContentContract.parse(content);

      expect(parsed).toBe('test content');
    });

    it('VALID: {value: ""} => parses empty content', () => {
      const content = FileContentStub({ value: '' });

      const parsed = fileContentContract.parse(content);

      expect(parsed).toBe('');
    });
  });

  describe('invalid file content', () => {
    it('INVALID_FILE_CONTENT: {value: number} => throws validation error', () => {
      expect(() => {
        return fileContentContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });
  });
});
