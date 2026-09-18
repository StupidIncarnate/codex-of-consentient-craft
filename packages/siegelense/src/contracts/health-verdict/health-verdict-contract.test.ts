import { healthStatics } from '../../statics/health/health-statics';

import { healthVerdictContract } from './health-verdict-contract';
import { HealthVerdictStub } from './health-verdict.stub';

describe('healthVerdictContract', () => {
  describe('valid members', () => {
    it.each(healthStatics.verdicts.all)('VALID: {value: %s} => parses to itself', (value) => {
      const verdict = HealthVerdictStub({ value });

      const result = healthVerdictContract.parse(verdict);

      expect(result).toBe(value);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "UNKNOWN"} => an unlisted string throws validation error', () => {
      expect(() => {
        HealthVerdictStub({ value: 'UNKNOWN' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "healthy"} => lowercase variant of valid member throws validation error', () => {
      expect(() => {
        healthVerdictContract.parse('healthy');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
