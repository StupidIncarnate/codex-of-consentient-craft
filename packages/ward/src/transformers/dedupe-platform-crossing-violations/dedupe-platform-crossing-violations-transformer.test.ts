import { dedupePlatformCrossingViolationsTransformer } from './dedupe-platform-crossing-violations-transformer';
import { PlatformCrossingViolationStub } from '../../contracts/platform-crossing-violation/platform-crossing-violation.stub';

describe('dedupePlatformCrossingViolationsTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {two identical violations} => keeps only the first', () => {
      const violation = PlatformCrossingViolationStub();

      const result = dedupePlatformCrossingViolationsTransformer({
        violations: [violation, violation],
      });

      expect(result).toStrictEqual([violation]);
    });

    it('VALID: {two violations with different chains} => keeps both', () => {
      const first = PlatformCrossingViolationStub({ chain: ['@dungeonmaster/node/fs'] });
      const second = PlatformCrossingViolationStub({ chain: ['@dungeonmaster/node/process'] });

      const result = dedupePlatformCrossingViolationsTransformer({ violations: [first, second] });

      expect(result).toStrictEqual([first, second]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {violations: []} => returns an empty array', () => {
      const result = dedupePlatformCrossingViolationsTransformer({ violations: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
