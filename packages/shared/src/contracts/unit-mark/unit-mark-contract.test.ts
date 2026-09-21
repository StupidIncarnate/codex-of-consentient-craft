import { unitMarkContract } from './unit-mark-contract';
import { UnitMarkStub } from './unit-mark.stub';

describe('unitMarkContract', () => {
  describe('valid marks', () => {
    it.each(['met', 'cant-meet', 'unmet'] as const)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        expect(UnitMarkStub({ value })).toBe(value);
      },
    );
  });

  describe('invalid marks', () => {
    it('INVALID: {value: "confirmed"} => throws, naming the replaced word as invalid', () => {
      expect(() => unitMarkContract.parse('confirmed')).toThrow(/confirmed/u);
    });

    it('EMPTY: {value: ""} => throws', () => {
      expect(() => unitMarkContract.parse('')).toThrow(/Invalid/u);
    });
  });
});
