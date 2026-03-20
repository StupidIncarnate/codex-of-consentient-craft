import { durationDisplayTransformer } from './duration-display-transformer';

describe('durationDisplayTransformer', () => {
  describe('seconds only', () => {
    it('VALID: {12 second gap} => returns "12s"', () => {
      const result = durationDisplayTransformer({
        startedAt: '2024-01-15T10:00:00.000Z' as never,
        completedAt: '2024-01-15T10:00:12.000Z' as never,
      });

      expect(result).toBe('12s');
    });

    it('EDGE: {0 second gap} => returns "0s"', () => {
      const result = durationDisplayTransformer({
        startedAt: '2024-01-15T10:00:00.000Z' as never,
        completedAt: '2024-01-15T10:00:00.000Z' as never,
      });

      expect(result).toBe('0s');
    });
  });

  describe('minutes and seconds', () => {
    it('VALID: {2 minute 34 second gap} => returns "2m 34s"', () => {
      const result = durationDisplayTransformer({
        startedAt: '2024-01-15T10:00:00.000Z' as never,
        completedAt: '2024-01-15T10:02:34.000Z' as never,
      });

      expect(result).toBe('2m 34s');
    });

    it('VALID: {1 minute exactly} => returns "1m 0s"', () => {
      const result = durationDisplayTransformer({
        startedAt: '2024-01-15T10:00:00.000Z' as never,
        completedAt: '2024-01-15T10:01:00.000Z' as never,
      });

      expect(result).toBe('1m 0s');
    });
  });
});
