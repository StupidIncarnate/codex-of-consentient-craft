import { subagentDurationLabelTransformer } from './subagent-duration-label-transformer';
import { SubagentElapsedInputStub } from '../../contracts/subagent-elapsed-input/subagent-elapsed-input.stub';

describe('subagentDurationLabelTransformer', () => {
  describe('reportedDurationMs branch — does the notification report durationMs?', () => {
    it('VALID: {reportedDurationMs: 270000, endedAt gap: 600000ms} => returns "4m"', () => {
      const input = SubagentElapsedInputStub({
        startedAt: '2026-09-10T10:00:00.000Z',
        endedAt: '2026-09-10T10:10:00.000Z',
        reportedDurationMs: 270000,
      });

      const result = subagentDurationLabelTransformer({ input });

      expect(result).toBe('4m');
    });

    it('VALID: {reportedDurationMs omitted, endedAt gap: 600000ms} => returns "10m"', () => {
      const input = SubagentElapsedInputStub({
        startedAt: '2026-09-10T10:00:00.000Z',
        endedAt: '2026-09-10T10:10:00.000Z',
      });

      const result = subagentDurationLabelTransformer({ input });

      expect(result).toBe('10m');
    });
  });

  describe('endedAt branch — does the chain carry a completion notification?', () => {
    it('VALID: {endedAt: 4m30s gap, clockReading: 1h gap} => returns the endedAt figure', () => {
      const input = SubagentElapsedInputStub({
        startedAt: '2026-09-10T10:00:00.000Z',
        endedAt: '2026-09-10T10:04:30.000Z',
        clockReading: '2026-09-10T11:00:00.000Z',
      });

      const result = subagentDurationLabelTransformer({ input });

      expect(result).toBe('4m');
    });

    it('VALID: {no endedAt, no reportedDurationMs, clockReading: 4m30s gap} => returns the clockReading figure', () => {
      const input = SubagentElapsedInputStub({
        startedAt: '2026-09-10T10:00:00.000Z',
        clockReading: '2026-09-10T10:04:30.000Z',
      });

      const result = subagentDurationLabelTransformer({ input });

      expect(result).toBe('4m');
    });
  });

  describe('clockReading branch — did the chain receive a clock to measure against?', () => {
    it('VALID: {clockReading: 1m gap, no endedAt, no reportedDurationMs} => returns "1m"', () => {
      const input = SubagentElapsedInputStub({
        startedAt: '2026-09-10T10:00:00.000Z',
        clockReading: '2026-09-10T10:01:00.000Z',
      });

      const result = subagentDurationLabelTransformer({ input });

      expect(result).toBe('1m');
    });

    it('EMPTY: {startedAt only} => returns null', () => {
      const input = SubagentElapsedInputStub({
        startedAt: '2026-09-10T10:00:00.000Z',
      });

      const result = subagentDurationLabelTransformer({ input });

      expect(result).toBe(null);
    });
  });
});
