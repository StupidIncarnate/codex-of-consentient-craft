import { completedCountContract } from './completed-count-contract';
import { CompletedCountStub } from './completed-count.stub';

describe('completedCountContract', () => {
  describe('valid counts', () => {
    it('VALID: {zero} => parses successfully', () => {
      const count = CompletedCountStub({ value: 0 });

      const result = completedCountContract.parse(count);

      expect(result).toBe(0);
    });

    it('VALID: {positive integer} => parses successfully', () => {
      const count = CompletedCountStub({ value: 5 });

      const result = completedCountContract.parse(count);

      expect(result).toBe(5);
    });
  });

  describe('invalid counts', () => {
    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => {
        completedCountContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {decimal number} => throws validation error', () => {
      expect(() => {
        completedCountContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
