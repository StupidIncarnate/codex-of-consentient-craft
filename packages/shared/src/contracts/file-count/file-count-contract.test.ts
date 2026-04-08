import { fileCountContract } from './file-count-contract';
import { FileCountStub } from './file-count.stub';

describe('fileCountContract', () => {
  describe('valid file counts', () => {
    it('VALID: 42 => parses to FileCount branded type', () => {
      const result = fileCountContract.parse(42);

      expect(result).toBe(42);
    });

    it('VALID: 0 => parses zero to FileCount branded type', () => {
      const result = fileCountContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: 1000 => parses large value to FileCount branded type', () => {
      const result = fileCountContract.parse(1000);

      expect(result).toBe(1000);
    });
  });

  describe('invalid file counts', () => {
    it('ERROR: -1 => throws for negative number', () => {
      expect(() => fileCountContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('ERROR: 1.5 => throws for non-integer', () => {
      expect(() => fileCountContract.parse(1.5)).toThrow(/Expected integer, received float/u);
    });

    it('ERROR: "42" => throws for string', () => {
      expect(() => fileCountContract.parse('42')).toThrow(/Expected number, received string/u);
    });
  });

  describe('stub', () => {
    it('VALID: FileCountStub() => returns default stub value', () => {
      const result = FileCountStub();

      expect(result).toBe(42);
    });

    it('VALID: FileCountStub({value: 100}) => returns custom value', () => {
      const result = FileCountStub({ value: 100 });

      expect(result).toBe(100);
    });
  });
});
