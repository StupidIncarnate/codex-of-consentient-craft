import { menuIndexContract } from './menu-index-contract';
import { MenuIndexStub } from './menu-index.stub';

describe('menuIndexContract', () => {
  describe('valid indices', () => {
    it('VALID: {value: 0} => parses successfully', () => {
      const index = MenuIndexStub({ value: 0 });

      const result = menuIndexContract.parse(index);

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => parses successfully', () => {
      const index = MenuIndexStub({ value: 5 });

      const result = menuIndexContract.parse(index);

      expect(result).toBe(5);
    });

    it('VALID: {default stub} => parses to 0', () => {
      const index = MenuIndexStub();

      const result = menuIndexContract.parse(index);

      expect(result).toBe(0);
    });
  });

  describe('invalid indices', () => {
    it('INVALID_NEGATIVE: {value: -1} => throws validation error', () => {
      expect(() => {
        menuIndexContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID_FLOAT: {value: 1.5} => throws validation error', () => {
      expect(() => {
        menuIndexContract.parse(1.5);
      }).toThrow(/invalid_type/u);
    });

    it('INVALID_STRING: {value: "0"} => throws validation error', () => {
      expect(() => {
        menuIndexContract.parse('0');
      }).toThrow(/invalid_type/u);
    });
  });
});
