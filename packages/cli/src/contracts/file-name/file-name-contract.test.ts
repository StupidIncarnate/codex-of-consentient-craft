import { fileNameContract } from './file-name-contract';
import { FileNameStub } from './file-name.stub';

describe('fileNameContract', () => {
  describe('valid file names', () => {
    it('VALID: "quest.json" => parses as FileName', () => {
      const result = fileNameContract.parse('quest.json');

      expect(result).toBe('quest.json');
    });

    it('VALID: "add-auth.json" => parses as FileName', () => {
      const result = fileNameContract.parse('add-auth.json');

      expect(result).toBe('add-auth.json');
    });

    it('VALID: ".hidden" => parses hidden file as FileName', () => {
      const result = fileNameContract.parse('.hidden');

      expect(result).toBe('.hidden');
    });

    it('VALID: FileNameStub({value: "test.json"}) => creates stub', () => {
      const result = FileNameStub({ value: 'test.json' });

      expect(result).toBe('test.json');
    });
  });
});
