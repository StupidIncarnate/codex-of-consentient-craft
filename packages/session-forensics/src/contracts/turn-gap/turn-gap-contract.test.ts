import { turnGapContract } from './turn-gap-contract';
import { TurnGapStub } from './turn-gap.stub';

describe('turnGapContract', () => {
  describe('valid input', () => {
    it('VALID: {liveSubagentIds: two agents} => returns the branded gap blocked on both', () => {
      const result = turnGapContract.parse({
        gapStartedAt: '2026-09-01T19:09:06.542Z',
        elapsedMinutes: 12,
        gapSeconds: 45,
        liveSubagentIds: ['agent-alpha', 'agent-beta'],
      });

      expect(result).toStrictEqual(
        TurnGapStub({
          gapStartedAt: '2026-09-01T19:09:06.542Z',
          elapsedMinutes: 12,
          gapSeconds: 45,
          liveSubagentIds: ['agent-alpha', 'agent-beta'],
        }),
      );
    });
  });

  describe('defaults', () => {
    it('EMPTY: {liveSubagentIds omitted} => defaults to [], the true-idle case', () => {
      const result = turnGapContract.parse({
        gapStartedAt: '2026-09-01T19:09:06.542Z',
        elapsedMinutes: 5,
        gapSeconds: 30,
      });

      expect(result).toStrictEqual(
        TurnGapStub({
          gapStartedAt: '2026-09-01T19:09:06.542Z',
          elapsedMinutes: 5,
          gapSeconds: 30,
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {gapSeconds: 0} => returns the branded gap', () => {
      const result = turnGapContract.parse({
        gapStartedAt: '2026-09-01T19:09:06.542Z',
        elapsedMinutes: 5,
        gapSeconds: 0,
      });

      expect(result).toStrictEqual(
        TurnGapStub({
          gapStartedAt: '2026-09-01T19:09:06.542Z',
          elapsedMinutes: 5,
          gapSeconds: 0,
        }),
      );
    });

    it('EDGE: {liveSubagentIds: one agent} => returns the branded gap blocked on it', () => {
      const result = turnGapContract.parse({
        gapStartedAt: '2026-09-01T19:09:06.542Z',
        elapsedMinutes: 5,
        gapSeconds: 30,
        liveSubagentIds: ['agent-solo'],
      });

      expect(result).toStrictEqual(
        TurnGapStub({
          gapStartedAt: '2026-09-01T19:09:06.542Z',
          elapsedMinutes: 5,
          gapSeconds: 30,
          liveSubagentIds: ['agent-solo'],
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {gapSeconds: -1} => throws', () => {
      expect(() => TurnGapStub({ gapSeconds: -1 })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });

    it('INVALID: {gapStartedAt omitted} => throws', () => {
      expect(() =>
        turnGapContract.parse({
          elapsedMinutes: 5,
          gapSeconds: 30,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {liveSubagentIds: bare string} => throws', () => {
      expect(() => TurnGapStub({ liveSubagentIds: 'agent-abc' as never })).toThrow(
        /Expected array/u,
      );
    });
  });
});
