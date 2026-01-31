import { getBuildTimestampTransformer } from './get-build-timestamp-transformer';
import type { BuildTimestampStub } from '../../contracts/build-timestamp/build-timestamp.stub';

type BuildTimestamp = ReturnType<typeof BuildTimestampStub>;

describe('getBuildTimestampTransformer', () => {
  describe('when __BUILD_TIMESTAMP__ is not defined', () => {
    it('VALID: undefined global => returns "dev"', () => {
      const result: BuildTimestamp = getBuildTimestampTransformer();

      expect(result).toBe('dev');
    });
  });
});
