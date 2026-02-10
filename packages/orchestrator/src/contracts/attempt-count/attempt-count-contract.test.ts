import { attemptCountContract } from './attempt-count-contract';
import { AttemptCountStub } from './attempt-count.stub';

describe('attemptCountContract', () => {
  describe('valid counts', () => {
    it('VALID: {zero} => parses successfully', () => {
      const count = AttemptCountStub({ value: 0 });

      const result = attemptCountContract.parse(count);

      expect(result).toBe(0);
    });

    it('VALID: {positive integer} => parses successfully', () => {
      const count = AttemptCountStub({ value: 3 });

      const result = attemptCountContract.parse(count);

      expect(result).toBe(3);
    });
  });

  describe('invalid counts', () => {
    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => {
        attemptCountContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {decimal number} => throws validation error', () => {
      expect(() => {
        attemptCountContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
