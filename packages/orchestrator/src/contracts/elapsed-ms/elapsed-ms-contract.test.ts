import { elapsedMsContract } from './elapsed-ms-contract';
import { ElapsedMsStub } from './elapsed-ms.stub';

describe('elapsedMsContract', () => {
  describe('valid values', () => {
    it('VALID: {zero} => parses successfully', () => {
      const value = ElapsedMsStub({ value: 0 });

      const result = elapsedMsContract.parse(value);

      expect(result).toBe(0);
    });

    it('VALID: {positive integer} => parses successfully', () => {
      const value = ElapsedMsStub({ value: 1500 });

      const result = elapsedMsContract.parse(value);

      expect(result).toBe(1500);
    });
  });

  describe('invalid values', () => {
    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => {
        elapsedMsContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {decimal number} => throws validation error', () => {
      expect(() => {
        elapsedMsContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
