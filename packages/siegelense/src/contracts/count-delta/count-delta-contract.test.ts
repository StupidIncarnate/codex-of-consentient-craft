import { countDeltaContract } from './count-delta-contract';
import { CountDeltaStub } from './count-delta.stub';

describe('countDeltaContract', () => {
  describe('valid deltas', () => {
    it('VALID: {value: "+2"} => parses successfully', () => {
      const delta = CountDeltaStub({ value: '+2' });

      const result = countDeltaContract.parse(delta);

      expect(result).toBe('+2');
    });

    it('VALID: {value: "-3"} => parses successfully', () => {
      const delta = CountDeltaStub({ value: '-3' });

      const result = countDeltaContract.parse(delta);

      expect(result).toBe('-3');
    });

    it('VALID: {value: "+0"} => a zero delta still carries an explicit sign', () => {
      const delta = CountDeltaStub({ value: '+0' });

      const result = countDeltaContract.parse(delta);

      expect(result).toBe('+0');
    });
  });

  describe('invalid deltas', () => {
    it('INVALID: {value: "0"} => an unsigned zero throws validation error', () => {
      expect(() => {
        countDeltaContract.parse('0');
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {value: "2"} => a missing sign throws validation error', () => {
      expect(() => {
        countDeltaContract.parse('2');
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {value: "+2.5"} => a decimal throws validation error', () => {
      expect(() => {
        countDeltaContract.parse('+2.5');
      }).toThrow(/Invalid/u);
    });
  });
});
