import { gapReportContract } from './gap-report-contract';
import { GapReportStub } from './gap-report.stub';
import { TurnGapStub } from '../turn-gap/turn-gap.stub';

describe('gapReportContract', () => {
  describe('valid input', () => {
    it('VALID: {two gaps, mixed blocked and idle} => returns the branded report', () => {
      const result = gapReportContract.parse({
        gaps: [
          TurnGapStub({
            gapStartedAt: '2026-09-01T19:00:00.000Z',
            elapsedMinutes: 0,
            gapSeconds: 300,
            liveSubagentIds: [],
          }),
          TurnGapStub({
            gapStartedAt: '2026-09-01T19:05:00.000Z',
            elapsedMinutes: 5,
            gapSeconds: 400,
            liveSubagentIds: ['agent-worker'],
          }),
        ],
        wallClockSeconds: 700,
        blockedSeconds: 400,
        idleSeconds: 300,
      });

      expect(result).toStrictEqual(
        GapReportStub({
          gaps: [
            TurnGapStub({
              gapStartedAt: '2026-09-01T19:00:00.000Z',
              elapsedMinutes: 0,
              gapSeconds: 300,
              liveSubagentIds: [],
            }),
            TurnGapStub({
              gapStartedAt: '2026-09-01T19:05:00.000Z',
              elapsedMinutes: 5,
              gapSeconds: 400,
              liveSubagentIds: ['agent-worker'],
            }),
          ],
          wallClockSeconds: 700,
          blockedSeconds: 400,
          idleSeconds: 300,
        }),
      );
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no gaps, every total 0} => returns the branded silent report', () => {
      const result = gapReportContract.parse({
        gaps: [],
        wallClockSeconds: 0,
        blockedSeconds: 0,
        idleSeconds: 0,
      });

      expect(result).toStrictEqual(
        GapReportStub({
          gaps: [],
          wallClockSeconds: 0,
          blockedSeconds: 0,
          idleSeconds: 0,
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {blockedSeconds: -1} => throws', () => {
      expect(() => GapReportStub({ blockedSeconds: -1 })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });

    it('INVALID: {gaps: bare object} => throws', () => {
      expect(() => GapReportStub({ gaps: { gapSeconds: 5 } as never })).toThrow(/Expected array/u);
    });
  });

  describe('missing fields', () => {
    it('EMPTY: {no idleSeconds} => throws', () => {
      expect(() =>
        gapReportContract.parse({
          gaps: [],
          wallClockSeconds: 0,
          blockedSeconds: 0,
        }),
      ).toThrow(/Required/u);
    });
  });
});
