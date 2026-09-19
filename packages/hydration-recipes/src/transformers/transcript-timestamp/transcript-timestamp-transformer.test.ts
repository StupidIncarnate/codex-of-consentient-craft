import { transcriptTimestampTransformer } from './transcript-timestamp-transformer';

describe('transcriptTimestampTransformer', () => {
  describe('offsets from the fixed base', () => {
    it('VALID: {offsetSeconds: 0} => returns the base instant itself', () => {
      expect(transcriptTimestampTransformer({ offsetSeconds: 0 })).toBe('2026-01-01T00:00:00.000Z');
    });

    it('VALID: {offsetSeconds: 3} => returns the base plus three seconds', () => {
      expect(transcriptTimestampTransformer({ offsetSeconds: 3 })).toBe('2026-01-01T00:00:03.000Z');
    });

    it('EDGE: {offsetSeconds: 10} => returns the base plus ten seconds', () => {
      expect(transcriptTimestampTransformer({ offsetSeconds: 10 })).toBe(
        '2026-01-01T00:00:10.000Z',
      );
    });
  });

  describe('determinism', () => {
    it('VALID: {same offset twice} => returns the same instant', () => {
      expect(transcriptTimestampTransformer({ offsetSeconds: 4 })).toBe(
        transcriptTimestampTransformer({ offsetSeconds: 4 }),
      );
    });
  });
});
