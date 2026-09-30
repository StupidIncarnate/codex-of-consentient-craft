import { getBuildTimestampTransformer } from './get-build-timestamp-transformer';

type BuildTimestamp = string;

describe('getBuildTimestampTransformer', () => {
  describe('when __BUILD_TIMESTAMP__ is not defined', () => {
    it('VALID: undefined global => returns "dev"', () => {
      const result: BuildTimestamp = getBuildTimestampTransformer();

      expect(result).toBe('dev');
    });
  });
});
