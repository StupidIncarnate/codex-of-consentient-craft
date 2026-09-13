import { subagentElapsedInputContract } from './subagent-elapsed-input-contract';
import { SubagentElapsedInputStub } from './subagent-elapsed-input.stub';

describe('subagentElapsedInputContract', () => {
  describe('required startedAt', () => {
    it('VALID: {startedAt only} => parses to an object with only startedAt set', () => {
      const result = subagentElapsedInputContract.parse({
        startedAt: '2026-09-10T10:00:00.000Z',
      });

      expect(result).toStrictEqual({ startedAt: '2026-09-10T10:00:00.000Z' });
    });

    it('INVALID: {missing startedAt} => throws "Required"', () => {
      expect(() => subagentElapsedInputContract.parse({})).toThrow('Required');
    });
  });

  describe('optional fields omitted', () => {
    it('EMPTY: {no endedAt, reportedDurationMs, clockReading} => result carries only startedAt', () => {
      const result = SubagentElapsedInputStub();

      expect(result).toStrictEqual({ startedAt: '2026-09-10T10:00:00.000Z' });
    });
  });

  describe('optional fields supplied', () => {
    it('VALID: {endedAt: "2026-09-10T10:05:00.000Z"} => result carries endedAt', () => {
      const result = subagentElapsedInputContract.parse({
        startedAt: '2026-09-10T10:00:00.000Z',
        endedAt: '2026-09-10T10:05:00.000Z',
      });

      expect(result).toStrictEqual({
        startedAt: '2026-09-10T10:00:00.000Z',
        endedAt: '2026-09-10T10:05:00.000Z',
      });
    });

    it('VALID: {reportedDurationMs: 9033} => result carries reportedDurationMs', () => {
      const result = subagentElapsedInputContract.parse({
        startedAt: '2026-09-10T10:00:00.000Z',
        reportedDurationMs: 9033,
      });

      expect(result).toStrictEqual({
        startedAt: '2026-09-10T10:00:00.000Z',
        reportedDurationMs: 9033,
      });
    });

    it('VALID: {clockReading: "2026-09-10T10:01:00.000Z"} => result carries clockReading', () => {
      const result = subagentElapsedInputContract.parse({
        startedAt: '2026-09-10T10:00:00.000Z',
        clockReading: '2026-09-10T10:01:00.000Z',
      });

      expect(result).toStrictEqual({
        startedAt: '2026-09-10T10:00:00.000Z',
        clockReading: '2026-09-10T10:01:00.000Z',
      });
    });
  });

  describe('invalid reportedDurationMs', () => {
    it('INVALID: {reportedDurationMs: -1} => throws "Number must be greater than or equal to 0"', () => {
      expect(() =>
        subagentElapsedInputContract.parse({
          startedAt: '2026-09-10T10:00:00.000Z',
          reportedDurationMs: -1,
        }),
      ).toThrow('Number must be greater than or equal to 0');
    });

    it('INVALID: {reportedDurationMs: 1.5} => throws "Expected integer, received float"', () => {
      expect(() =>
        subagentElapsedInputContract.parse({
          startedAt: '2026-09-10T10:00:00.000Z',
          reportedDurationMs: 1.5,
        }),
      ).toThrow('Expected integer, received float');
    });
  });

  describe('stub', () => {
    it('VALID: SubagentElapsedInputStub() => returns default stub value', () => {
      const result = SubagentElapsedInputStub();

      expect(result).toStrictEqual({ startedAt: '2026-09-10T10:00:00.000Z' });
    });
  });
});
