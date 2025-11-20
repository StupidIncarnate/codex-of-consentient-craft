import { fileNameContract } from './file-name-contract';
import { FileNameStub } from './file-name.stub';

describe('fileNameContract', () => {
  describe('valid file names', () => {
    it('VALID: {value: "test.txt"} => parses successfully', () => {
      const fileName = FileNameStub({ value: 'test.txt' });

      const parsed = fileNameContract.parse(fileName);

      expect(parsed).toBe('test.txt');
    });

    it('VALID: {value: "package.json"} => parses different file', () => {
      const fileName = FileNameStub({ value: 'package.json' });

      const parsed = fileNameContract.parse(fileName);

      expect(parsed).toBe('package.json');
    });
  });

  describe('invalid file names', () => {
    it('INVALID_FILE_NAME: {value: number} => throws validation error', () => {
      expect(() => {
        return fileNameContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });
  });
});
