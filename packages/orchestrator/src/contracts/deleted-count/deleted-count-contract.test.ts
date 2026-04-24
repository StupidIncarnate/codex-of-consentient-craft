import { deletedCountContract } from './deleted-count-contract';
import { DeletedCountStub } from './deleted-count.stub';

describe('deletedCountContract', () => {
  describe('valid counts', () => {
    it('VALID: {zero} => parses successfully', () => {
      const count = DeletedCountStub({ value: 0 });

      const result = deletedCountContract.parse(count);

      expect(result).toBe(0);
    });

    it('VALID: {positive integer} => parses successfully', () => {
      const count = DeletedCountStub({ value: 7 });

      const result = deletedCountContract.parse(count);

      expect(result).toBe(7);
    });
  });

  describe('invalid counts', () => {
    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => {
        deletedCountContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {decimal number} => throws validation error', () => {
      expect(() => {
        deletedCountContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
