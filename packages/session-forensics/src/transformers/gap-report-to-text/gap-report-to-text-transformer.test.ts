import { gapReportToTextTransformer } from './gap-report-to-text-transformer';
import { GapReportStub } from '../../contracts/gap-report/gap-report.stub';
import { TurnGapStub } from '../../contracts/turn-gap/turn-gap.stub';

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
          'GAPS >= 120s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '0.0m 300s  agent-worker',
          '10.0m 150s  *** NOTHING RUNNING ***',
          '',
          'WALL CLOCK      10.0 min',
          'IN GAPS         7.5 min  (75.0%)',
          '  blocked on sub  5.0 min  (50.0%)',
          '  TRUE IDLE       2.5 min  (25.0%)',
        ].join('\n'),
      );
    });
  });

  describe('no gaps at all', () => {
    it('EMPTY: {gaps: []} => header with no rows, summary all-zero except wall clock', () => {
      const report = GapReportStub({
        gaps: [],
        wallClockSeconds: 300,
        blockedSeconds: 0,
        idleSeconds: 0,
      });

      const result = gapReportToTextTransformer({ report });

      expect(String(result)).toBe(
        [
          'GAPS >= 120s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '',
          'WALL CLOCK      5.0 min',
          'IN GAPS         0.0 min  (0.0%)',
          '  blocked on sub  0.0 min  (0.0%)',
          '  TRUE IDLE       0.0 min  (0.0%)',
        ].join('\n'),
      );
    });
  });

  describe('every gap idle', () => {
    it('VALID: {two idle gaps} => both rows marked NOTHING RUNNING, blocked stays at 0', () => {
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
          'GAPS >= 120s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '0.0m 200s  *** NOTHING RUNNING ***',
          '5.0m 130s  *** NOTHING RUNNING ***',
          '',
          'WALL CLOCK      5.5 min',
          'IN GAPS         5.5 min  (100.0%)',
          '  blocked on sub  0.0 min  (0.0%)',
          '  TRUE IDLE       5.5 min  (100.0%)',
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
          'GAPS >= 120s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '',
          'WALL CLOCK      0.0 min',
          'IN GAPS         0.0 min  (0.0%)',
          '  blocked on sub  0.0 min  (0.0%)',
          '  TRUE IDLE       0.0 min  (0.0%)',
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
          'GAPS >= 60s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '2.0m 90s  agent-x',
          '',
          'WALL CLOCK      1.5 min',
          'IN GAPS         1.5 min  (100.0%)',
          '  blocked on sub  1.5 min  (100.0%)',
          '  TRUE IDLE       0.0 min  (0.0%)',
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
          'GAPS >= 120s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '1.0m 200s  agent-alpha; agent-beta',
          '',
          'WALL CLOCK      3.3 min',
          'IN GAPS         3.3 min  (100.0%)',
          '  blocked on sub  3.3 min  (100.0%)',
          '  TRUE IDLE       0.0 min  (0.0%)',
        ].join('\n'),
      );
    });
  });
});
