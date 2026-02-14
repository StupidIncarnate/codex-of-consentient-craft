import { lineCountContract } from './line-count-contract';
import { LineCountStub } from './line-count.stub';

describe('lineCountContract', () => {
  describe('valid line counts', () => {
    it('VALID: 500 => parses to LineCount branded type', () => {
      const result = lineCountContract.parse(500);

      expect(result).toBe(500);
    });

    it('VALID: 1 => parses minimum positive value to LineCount branded type', () => {
      const result = lineCountContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: 10000 => parses large value to LineCount branded type', () => {
      const result = lineCountContract.parse(10000);

      expect(result).toBe(10000);
    });
  });

  describe('invalid line counts', () => {
    it('ERROR: 0 => throws for zero', () => {
      expect(() => lineCountContract.parse(0)).toThrow(/Number must be greater than 0/u);
    });

    it('ERROR: -1 => throws for negative number', () => {
      expect(() => lineCountContract.parse(-1)).toThrow(/Number must be greater than 0/u);
    });

    it('ERROR: 1.5 => throws for non-integer', () => {
      expect(() => lineCountContract.parse(1.5)).toThrow(/Expected integer, received float/u);
    });

    it('ERROR: "500" => throws for string', () => {
      expect(() => lineCountContract.parse('500')).toThrow(/Expected number, received string/u);
    });
  });

  describe('stub', () => {
    it('VALID: LineCountStub() => returns default stub value', () => {
      const result = LineCountStub();

      expect(result).toBe(500);
    });

    it('VALID: LineCountStub({value: 100}) => returns custom value', () => {
      const result = LineCountStub({ value: 100 });

      expect(result).toBe(100);
    });
  });
});
