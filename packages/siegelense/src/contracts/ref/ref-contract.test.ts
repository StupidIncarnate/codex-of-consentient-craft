import { refContract } from './ref-contract';
import { RefStub } from './ref.stub';

describe('refContract', () => {
  describe('valid refs', () => {
    it('VALID: {value: 23} => parses to 23', () => {
      const ref = RefStub({ value: 23 });

      const result = refContract.parse(ref);

      expect(result).toBe(23);
    });

    it('VALID: {value: 1} => parses the lowest ref a look can mint', () => {
      const ref = RefStub({ value: 1 });

      const result = refContract.parse(ref);

      expect(result).toBe(1);
    });

    it('VALID: {no argument} => parses the stub default', () => {
      const ref = RefStub();

      expect(ref).toBe(23);
    });
  });

  describe('invalid refs', () => {
    it('INVALID: {value: 0} => throws, because a ref is index + 1 and zero names no element', () => {
      expect(() => refContract.parse(0)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: {value: -1} => throws for a negative ref', () => {
      expect(() => refContract.parse(-1)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: {value: 2.5} => throws, because a ref indexes an array', () => {
      expect(() => refContract.parse(2.5)).toThrow(/Expected integer/u);
    });

    it('INVALID: {value: "23"} => throws, because a ref is a number and never its rendering', () => {
      expect(() => refContract.parse('23')).toThrow(/Expected number/u);
    });
  });
});
