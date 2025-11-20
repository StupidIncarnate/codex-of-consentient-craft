import { filePathContract } from './file-path-contract';
import { FilePathStub } from './file-path.stub';

describe('filePathContract', () => {
  describe('valid paths', () => {
    it('VALID: "/tmp/test.txt" => returns FilePath', () => {
      const result = filePathContract.parse('/tmp/test.txt');

      expect(result).toBe('/tmp/test.txt');
    });

    it('VALID: "relative/path.txt" => returns FilePath', () => {
      const result = filePathContract.parse('relative/path.txt');

      expect(result).toBe('relative/path.txt');
    });

    it('VALID: "/" => returns FilePath', () => {
      const result = filePathContract.parse('/');

      expect(result).toBe('/');
    });
  });

  describe('FilePathStub', () => {
    it('VALID: {value: "/tmp/test.txt"} => returns FilePath', () => {
      const result = FilePathStub({ value: '/tmp/test.txt' });

      expect(result).toBe('/tmp/test.txt');
    });
  });
});
