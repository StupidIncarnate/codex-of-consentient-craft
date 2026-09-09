import { elapsedPartsContract } from './elapsed-parts-contract';
import { ElapsedPartsStub } from './elapsed-parts.stub';

describe('elapsedPartsContract', () => {
  describe('valid splits', () => {
    it('VALID: {hours: 2, minutes: 5, seconds: 30} => parses to ElapsedParts branded type', () => {
      const result = elapsedPartsContract.parse({ hours: 2, minutes: 5, seconds: 30 });

      expect(result).toStrictEqual({ hours: 2, minutes: 5, seconds: 30 });
    });
  });

  describe('invalid splits', () => {
    it('INVALID: {hours: -1} => throws "Number must be greater than or equal to 0"', () => {
      expect(() => elapsedPartsContract.parse({ hours: -1, minutes: 0, seconds: 0 })).toThrow(
        'Number must be greater than or equal to 0',
      );
    });

    it('INVALID: {minutes: 60} => throws "Number must be less than or equal to 59"', () => {
      expect(() => elapsedPartsContract.parse({ hours: 0, minutes: 60, seconds: 0 })).toThrow(
        'Number must be less than or equal to 59',
      );
    });

    it('INVALID: {seconds: 60} => throws "Number must be less than or equal to 59"', () => {
      expect(() => elapsedPartsContract.parse({ hours: 0, minutes: 0, seconds: 60 })).toThrow(
        'Number must be less than or equal to 59',
      );
    });

    it('INVALID: {hours: 1.5} => throws "Expected integer, received float"', () => {
      expect(() =>
        elapsedPartsContract.parse({ hours: 1.5 as never, minutes: 0, seconds: 0 }),
      ).toThrow('Expected integer, received float');
    });
  });

  describe('stub', () => {
    it('VALID: ElapsedPartsStub() => returns default stub value', () => {
      const result = ElapsedPartsStub();

      expect(result).toStrictEqual({ hours: 0, minutes: 0, seconds: 0 });
    });
  });
});
