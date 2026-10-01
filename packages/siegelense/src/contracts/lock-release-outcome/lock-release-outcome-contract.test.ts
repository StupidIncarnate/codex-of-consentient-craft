import { lockReleaseOutcomeContract } from './lock-release-outcome-contract';
import { LockReleaseOutcomeStub } from './lock-release-outcome.stub';

describe('lockReleaseOutcomeContract', () => {
  describe('valid members', () => {
    it.each(lockReleaseOutcomeContract.options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const lockReleaseOutcome = LockReleaseOutcomeStub({ value });

        const result = lockReleaseOutcomeContract.parse(lockReleaseOutcome);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid members', () => {
    it('INVALID: {value: "unheld"} => an unlisted string throws validation error', () => {
      expect(() => {
        LockReleaseOutcomeStub({ value: 'unheld' as never });
      }).toThrow(/Invalid option/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "RELEASED"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        lockReleaseOutcomeContract.parse('RELEASED');
      }).toThrow(/Invalid option/u);
    });
  });
});
