import { observableCountContract } from './observable-count-contract';
import { ObservableCountStub } from './observable-count.stub';

describe('observableCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses to 0', () => {
      const result = ObservableCountStub({ value: 0 });

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => parses to 5', () => {
      const result = ObservableCountStub({ value: 5 });

      expect(result).toBe(5);
    });

    it('VALID: {value: 3} => returns a valid ObservableCount branded number', () => {
      const result = observableCountContract.parse(3);

      expect(result).toBe(3);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative number', () => {
      expect(() => ObservableCountStub({ value: -1 as never })).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => ObservableCountStub({ value: 1.5 as never })).toThrow(
        /Expected integer, received float/u,
      );
    });

    it('INVALID: {value: "x"} => throws for non-number string', () => {
      expect(() => ObservableCountStub({ value: 'x' as never })).toThrow(
        /Expected number, received string/u,
      );
    });
  });
});
