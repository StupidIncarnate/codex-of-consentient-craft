import { gapReportToTextTransformer } from './gap-report-to-text-transformer';
import { GapReportStub } from '../../contracts/gap-report/gap-report.stub';
import { TurnGapStub } from '../../contracts/turn-gap/turn-gap.stub';

const WAITING_LINE = 'A gap that names sub-agents is time the session spent waiting on a helper.';
const NOTHING_LINE = 'A gap marked *** NOTHING RUNNING *** had nothing happening at all.';
const COLUMN_LINE = 'Minutes in  Gap      Sub-agents running';

describe('gapReportToTextTransformer', () => {
  describe('mixed blocked and idle gaps', () => {
    it('VALID: {one blocked gap, one idle gap} => header, both rows, and the split summary', () => {
      const report = GapReportStub({
        gaps: [
          TurnGapStub({
            gapStartedAt: '2026-09-01T19:00:00.000Z',
            elapsedMinutes: 0,
            gapSeconds: 300,
            liveSubagentIds: ['agent-worker'],
          }),
          TurnGapStub({
            gapStartedAt: '2026-09-01T19:10:00.000Z',
            elapsedMinutes: 10,
            gapSeconds: 150,
            liveSubagentIds: [],
          }),
        ],
        wallClockSeconds: 600,
        blockedSeconds: 300,
        idleSeconds: 150,
      });

      const result = gapReportToTextTransformer({ report });

      expect(String(result)).toBe(
        [
          'Gaps of 120 seconds or more between one model reply and the next.',
          WAITING_LINE,
          NOTHING_LINE,
          COLUMN_LINE,
          '0.0m 300s  agent-worker',
          '10.0m 150s  *** NOTHING RUNNING ***',
          '',
          'Ran for                 10.0 minutes',
          'Spent in gaps           7.5 minutes  (75.0%)',
          '  waiting on a sub-agent  5.0 minutes  (50.0%)',
          '  nothing running at all  2.5 minutes  (25.0%)',
        ].join('\n'),
      );
    });
  });

  describe('no gaps at all', () => {
    it('EMPTY: {gaps: []} => header with no rows, summary all-zero except the run length', () => {
      const report = GapReportStub({
        gaps: [],
        wallClockSeconds: 300,
        blockedSeconds: 0,
        idleSeconds: 0,
      });

      const result = gapReportToTextTransformer({ report });

      expect(String(result)).toBe(
        [
          'Gaps of 120 seconds or more between one model reply and the next.',
          WAITING_LINE,
          NOTHING_LINE,
          COLUMN_LINE,
          '',
          'Ran for                 5.0 minutes',
          'Spent in gaps           0.0 minutes  (0.0%)',
          '  waiting on a sub-agent  0.0 minutes  (0.0%)',
          '  nothing running at all  0.0 minutes  (0.0%)',
        ].join('\n'),
      );
    });
  });

  describe('every gap idle', () => {
    it('VALID: {two idle gaps} => both rows marked NOTHING RUNNING, waiting time stays at 0', () => {
      const report = GapReportStub({
        gaps: [
          TurnGapStub({
            gapStartedAt: '2026-09-01T19:00:00.000Z',
            elapsedMinutes: 0,
            gapSeconds: 200,
            liveSubagentIds: [],
          }),
          TurnGapStub({
            gapStartedAt: '2026-09-01T19:05:00.000Z',
            elapsedMinutes: 5,
            gapSeconds: 130,
            liveSubagentIds: [],
          }),
        ],
        wallClockSeconds: 330,
        blockedSeconds: 0,
        idleSeconds: 330,
      });

      const result = gapReportToTextTransformer({ report });

      expect(String(result)).toBe(
        [
          'Gaps of 120 seconds or more between one model reply and the next.',
          WAITING_LINE,
          NOTHING_LINE,
          COLUMN_LINE,
          '0.0m 200s  *** NOTHING RUNNING ***',
          '5.0m 130s  *** NOTHING RUNNING ***',
          '',
          'Ran for                 5.5 minutes',
          'Spent in gaps           5.5 minutes  (100.0%)',
          '  waiting on a sub-agent  0.0 minutes  (0.0%)',
          '  nothing running at all  5.5 minutes  (100.0%)',
        ].join('\n'),
      );
    });
  });

  describe('zero wall clock', () => {
    it('EDGE: {wallClockSeconds: 0} => every percentage renders 0.0%, no division by zero', () => {
      const report = GapReportStub({
        gaps: [],
        wallClockSeconds: 0,
        blockedSeconds: 0,
        idleSeconds: 0,
      });

      const result = gapReportToTextTransformer({ report });

      expect(String(result)).toBe(
        [
          'Gaps of 120 seconds or more between one model reply and the next.',
          WAITING_LINE,
          NOTHING_LINE,
          COLUMN_LINE,
          '',
          'Ran for                 0.0 minutes',
          'Spent in gaps           0.0 minutes  (0.0%)',
          '  waiting on a sub-agent  0.0 minutes  (0.0%)',
          '  nothing running at all  0.0 minutes  (0.0%)',
        ].join('\n'),
      );
    });
  });

  describe('explicit floor', () => {
    it('VALID: {floorSeconds: 60} => header prints the passed floor, not the default', () => {
      const report = GapReportStub({
        gaps: [
          TurnGapStub({
            gapStartedAt: '2026-09-01T19:00:00.000Z',
            elapsedMinutes: 2,
            gapSeconds: 90,
            liveSubagentIds: ['agent-x'],
          }),
        ],
        wallClockSeconds: 90,
        blockedSeconds: 90,
        idleSeconds: 0,
      });

      const result = gapReportToTextTransformer({ report, floorSeconds: 60 });

      expect(String(result)).toBe(
        [
          'Gaps of 60 seconds or more between one model reply and the next.',
          WAITING_LINE,
          NOTHING_LINE,
          COLUMN_LINE,
          '2.0m 90s  agent-x',
          '',
          'Ran for                 1.5 minutes',
          'Spent in gaps           1.5 minutes  (100.0%)',
          '  waiting on a sub-agent  1.5 minutes  (100.0%)',
          '  nothing running at all  0.0 minutes  (0.0%)',
        ].join('\n'),
      );
    });
  });

  describe('multiple live sub-agents', () => {
    it('EDGE: {liveSubagentIds: two agents} => both ids joined with a semicolon', () => {
      const report = GapReportStub({
        gaps: [
          TurnGapStub({
            gapStartedAt: '2026-09-01T19:00:00.000Z',
            elapsedMinutes: 1,
            gapSeconds: 200,
            liveSubagentIds: ['agent-alpha', 'agent-beta'],
          }),
        ],
        wallClockSeconds: 200,
        blockedSeconds: 200,
        idleSeconds: 0,
      });

      const result = gapReportToTextTransformer({ report });

      expect(String(result)).toBe(
        [
          'Gaps of 120 seconds or more between one model reply and the next.',
          WAITING_LINE,
          NOTHING_LINE,
          COLUMN_LINE,
          '1.0m 200s  agent-alpha; agent-beta',
          '',
          'Ran for                 3.3 minutes',
          'Spent in gaps           3.3 minutes  (100.0%)',
          '  waiting on a sub-agent  3.3 minutes  (100.0%)',
          '  nothing running at all  0.0 minutes  (0.0%)',
        ].join('\n'),
      );
    });
  });
});
