import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { runningRowNowTransformer } from './running-row-now-transformer';

describe('runningRowNowTransformer', () => {
  describe('running row', () => {
    it('VALID: {isRunning: true, now: defined} => returns now', () => {
      const now = IsoTimestampStub({ value: '2026-09-10T10:04:00.000Z' });

      const result = runningRowNowTransformer({ isRunning: true, now });

      expect(result).toBe(now);
    });

    it('EMPTY: {isRunning: true, now: undefined} => returns undefined', () => {
      const result = runningRowNowTransformer({ isRunning: true, now: undefined });

      expect(result).toBe(undefined);
    });
  });

  describe('stopped row', () => {
    it('VALID: {isRunning: false, now: defined} => returns undefined', () => {
      const now = IsoTimestampStub({ value: '2026-09-10T10:04:00.000Z' });

      const result = runningRowNowTransformer({ isRunning: false, now });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {isRunning: false, now: undefined} => returns undefined', () => {
      const result = runningRowNowTransformer({ isRunning: false, now: undefined });

      expect(result).toBe(undefined);
    });
  });
});
