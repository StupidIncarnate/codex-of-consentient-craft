import { resetLevelContract } from './reset-level-contract';
import { ResetLevelStub } from './reset-level.stub';

describe('resetLevelContract', () => {
  describe('valid members', () => {
    it.each(resetLevelContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const resetLevel = ResetLevelStub({ value });

        const result = resetLevelContract.parse(resetLevel);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid members', () => {
    it('INVALID: {value: "unknown"} => an unlisted string throws validation error', () => {
      expect(() => {
        ResetLevelStub({ value: 'unknown' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "STATE"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        resetLevelContract.parse('STATE');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
