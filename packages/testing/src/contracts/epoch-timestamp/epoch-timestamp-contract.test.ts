import { epochTimestampContract } from './epoch-timestamp-contract';
import { EpochTimestampStub } from './epoch-timestamp.stub';

describe('epochTimestampContract', () => {
  describe('valid values', () => {
    it('VALID: {value: 1700000000000} => parses successfully', () => {
      const ts = EpochTimestampStub({ value: 1700000000000 });

      const parsed = epochTimestampContract.parse(ts);

      expect(parsed).toBe(1700000000000);
    });

    it('VALID: {value: 0} => parses zero timestamp', () => {
      const ts = EpochTimestampStub({ value: 0 });

      const parsed = epochTimestampContract.parse(ts);

      expect(parsed).toBe(0);
    });
  });

  describe('invalid values', () => {
    it('INVALID_TYPE: {value: string} => throws validation error', () => {
      expect(() => {
        return epochTimestampContract.parse('not-a-number' as never);
      }).toThrow(/Expected number/u);
    });

    it('INVALID_NEGATIVE: {value: -1} => throws validation error', () => {
      expect(() => {
        return epochTimestampContract.parse(-1);
      }).toThrow(/Number must be greater than or equal to 0/u);
    });
  });
});
