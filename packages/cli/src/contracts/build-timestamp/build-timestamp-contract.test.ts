import { buildTimestampContract } from './build-timestamp-contract';
import { BuildTimestampStub } from './build-timestamp.stub';

type BuildTimestamp = ReturnType<typeof BuildTimestampStub>;

describe('buildTimestampContract', () => {
  describe('valid timestamps', () => {
    it('VALID: human-readable timestamp => parses successfully', () => {
      const timestamp: BuildTimestamp = BuildTimestampStub({ value: 'Jan 30 2:45 PM' });

      const result = buildTimestampContract.parse(timestamp);

      expect(result).toBe('Jan 30 2:45 PM');
    });

    it('VALID: dev timestamp => parses successfully', () => {
      const timestamp: BuildTimestamp = BuildTimestampStub({ value: 'dev' });

      const result = buildTimestampContract.parse(timestamp);

      expect(result).toBe('dev');
    });
  });

  describe('invalid timestamps', () => {
    it('INVALID: empty string => throws validation error', () => {
      expect(() => {
        return buildTimestampContract.parse('');
      }).toThrow(/too_small/u);
    });
  });
});
