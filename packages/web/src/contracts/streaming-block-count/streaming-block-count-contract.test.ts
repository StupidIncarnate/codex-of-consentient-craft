import { streamingBlockCountContract } from './streaming-block-count-contract';
import { StreamingBlockCountStub } from './streaming-block-count.stub';

describe('streamingBlockCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = streamingBlockCountContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => parses positive integer', () => {
      const result = streamingBlockCountContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 10} => parses larger positive integer', () => {
      const result = streamingBlockCountContract.parse(10);

      expect(result).toBe(10);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => streamingBlockCountContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => streamingBlockCountContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "0"} => throws for string', () => {
      expect(() => streamingBlockCountContract.parse('0')).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid streaming block count with default value 0', () => {
      const result = StreamingBlockCountStub();

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => creates streaming block count with custom value', () => {
      const result = StreamingBlockCountStub({ value: 5 });

      expect(result).toBe(5);
    });
  });
});
