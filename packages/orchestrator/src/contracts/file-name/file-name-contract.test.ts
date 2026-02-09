import { fileNameContract } from './file-name-contract';
import { FileNameStub } from './file-name.stub';

describe('fileNameContract', () => {
  describe('valid file names', () => {
    it('VALID: "quest.json" => parses successfully', () => {
      const result = fileNameContract.safeParse('quest.json');

      expect(result.success).toBe(true);
    });

    it('VALID: "001-add-auth" => parses folder name', () => {
      const result = fileNameContract.safeParse('001-add-auth');

      expect(result.success).toBe(true);
    });

    it('VALID: ".hidden" => parses hidden file', () => {
      const result = fileNameContract.safeParse('.hidden');

      expect(result.success).toBe(true);
    });
  });

  describe('FileNameStub', () => {
    it('STUB: default => returns test-file.txt', () => {
      const result = FileNameStub();

      expect(result).toBe('test-file.txt');
    });

    it('STUB: {value: "custom.txt"} => returns custom value', () => {
      const result = FileNameStub({ value: 'custom.txt' });

      expect(result).toBe('custom.txt');
    });
  });
});
