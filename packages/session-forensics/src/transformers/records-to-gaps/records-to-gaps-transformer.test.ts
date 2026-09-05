import { recordsToGapsTransformer } from './records-to-gaps-transformer';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';
import { SubagentWindowStub } from '../../contracts/subagent-window/subagent-window.stub';
import { GapReportStub } from '../../contracts/gap-report/gap-report.stub';
import { TurnGapStub } from '../../contracts/turn-gap/turn-gap.stub';

describe('recordsToGapsTransformer', () => {
  describe('valid input', () => {
    it('VALID: {two turns 300s apart, sub-agent live across the whole span} => one blocked gap, idle 0', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
        ],
        subagentWindows: [
          SubagentWindowStub({
            agentId: 'agent-alpha',
            startedAt: '2026-09-01T18:59:00.000Z',
            endedAt: '2026-09-01T19:06:00.000Z',
          }),
        ],
      });

      expect(result).toStrictEqual(
        GapReportStub({
          gaps: [
            TurnGapStub({
              gapStartedAt: '2026-09-01T19:00:00.000Z',
              elapsedMinutes: 0,
              gapSeconds: 300,
              liveSubagentIds: ['agent-alpha'],
            }),
          ],
          wallClockSeconds: 300,
          blockedSeconds: 300,
          idleSeconds: 0,
        }),
      );
    });

    it('VALID: {two turns 300s apart, no window} => one idle gap, blocked 0', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
        ],
        subagentWindows: [],
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
          ],
          wallClockSeconds: 300,
          blockedSeconds: 0,
          idleSeconds: 300,
        }),
      );
    });

    it('VALID: {three turns, one blocked gap and one idle gap} => both totals non-zero and summing to the total gap time', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:11:40.000Z' }),
        ],
        subagentWindows: [
          SubagentWindowStub({
            agentId: 'agent-worker',
            startedAt: '2026-09-01T19:05:00.000Z',
            endedAt: '2026-09-01T19:11:50.000Z',
          }),
        ],
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

      const totalGapSeconds = result.gaps.reduce((sum, gap) => sum + gap.gapSeconds, 0);

      expect(result.blockedSeconds + result.idleSeconds).toBe(totalGapSeconds);
    });

    it('VALID: {two windows overlapping one gap} => both ids present, in window order', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
        ],
        subagentWindows: [
          SubagentWindowStub({
            agentId: 'agent-alpha',
            startedAt: '2026-09-01T19:00:30.000Z',
            endedAt: '2026-09-01T19:02:00.000Z',
          }),
          SubagentWindowStub({
            agentId: 'agent-beta',
            startedAt: '2026-09-01T19:02:30.000Z',
            endedAt: '2026-09-01T19:04:00.000Z',
          }),
        ],
      });

      expect(result).toStrictEqual(
        GapReportStub({
          gaps: [
            TurnGapStub({
              gapStartedAt: '2026-09-01T19:00:00.000Z',
              elapsedMinutes: 0,
              gapSeconds: 300,
              liveSubagentIds: ['agent-alpha', 'agent-beta'],
            }),
          ],
          wallClockSeconds: 300,
          blockedSeconds: 300,
          idleSeconds: 0,
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {gap below the floor} => dropped, counted toward neither total', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:01:00.000Z' }),
        ],
        subagentWindows: [],
      });

      expect(result).toStrictEqual(
        GapReportStub({
          gaps: [],
          wallClockSeconds: 60,
          blockedSeconds: 0,
          idleSeconds: 0,
        }),
      );
    });

    it('EDGE: {gap exactly equal to the floor} => kept, not dropped', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:02:00.000Z' }),
        ],
        subagentWindows: [],
        floorSeconds: 120,
      });

      expect(result).toStrictEqual(
        GapReportStub({
          gaps: [
            TurnGapStub({
              gapStartedAt: '2026-09-01T19:00:00.000Z',
              elapsedMinutes: 0,
              gapSeconds: 120,
              liveSubagentIds: [],
            }),
          ],
          wallClockSeconds: 120,
          blockedSeconds: 0,
          idleSeconds: 120,
        }),
      );
    });

    it('EDGE: {window ending exactly at the gap start} => not live', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
        ],
        subagentWindows: [
          SubagentWindowStub({
            agentId: 'agent-early',
            startedAt: '2026-09-01T18:58:00.000Z',
            endedAt: '2026-09-01T19:00:00.000Z',
          }),
        ],
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
          ],
          wallClockSeconds: 300,
          blockedSeconds: 0,
          idleSeconds: 300,
        }),
      );
    });

    it('EDGE: {window covering only part of the gap} => still live', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
        ],
        subagentWindows: [
          SubagentWindowStub({
            agentId: 'agent-partial',
            startedAt: '2026-09-01T19:02:00.000Z',
            endedAt: '2026-09-01T19:03:00.000Z',
          }),
        ],
      });

      expect(result).toStrictEqual(
        GapReportStub({
          gaps: [
            TurnGapStub({
              gapStartedAt: '2026-09-01T19:00:00.000Z',
              elapsedMinutes: 0,
              gapSeconds: 300,
              liveSubagentIds: ['agent-partial'],
            }),
          ],
          wallClockSeconds: 300,
          blockedSeconds: 300,
          idleSeconds: 0,
        }),
      );
    });

    it('EDGE: {assistant record without a timestamp, and a user record between two turns} => timestamp-less record skipped, gap not split', () => {
      const result = recordsToGapsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: undefined }),
          TranscriptRecordStub({
            type: 'user',
            timestamp: '2026-09-01T19:02:00.000Z',
            message: { content: 'a note in between' },
          }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
        ],
        subagentWindows: [],
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
          ],
          wallClockSeconds: 300,
          blockedSeconds: 0,
          idleSeconds: 300,
        }),
      );
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no records} => empty gaps, all totals 0', () => {
      const result = recordsToGapsTransformer({
        records: [],
        subagentWindows: [],
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

    it('EMPTY: {one record only} => no pairs, empty gaps', () => {
      const result = recordsToGapsTransformer({
        records: [TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })],
        subagentWindows: [],
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
});
