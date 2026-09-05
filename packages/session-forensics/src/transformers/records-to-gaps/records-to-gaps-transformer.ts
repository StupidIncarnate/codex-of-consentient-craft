/**
 * PURPOSE: A session that stops emitting turns looks the same in the raw transcript either way:
 * blocked on a sub-agent doing real work, or genuinely stalled with nothing running. Measured by
 * hand across one quest, collapsing that distinction produced "67-94% idle". Separating it produced
 * "~1% true dead air, the rest serialisation." This transformer is the one place in the package
 * that crosses turn gaps against sub-agent windows, to tell the two apart.
 *
 * USAGE:
 * recordsToGapsTransformer({
 *   records: [
 *     TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
 *     TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
 *   ],
 *   subagentWindows: [],
 * });
 * // Returns { gaps: [<one 300s gap>], wallClockSeconds: 300, blockedSeconds: 0, idleSeconds: 300 }
 */
import { digestDefaultStatics } from '../../statics/digest-default/digest-default-statics';
import { turnGapContract } from '../../contracts/turn-gap/turn-gap-contract';
import { gapReportContract, type GapReport } from '../../contracts/gap-report/gap-report-contract';
import type { TranscriptRecord } from '../../contracts/transcript-record/transcript-record-contract';
import type { SubagentWindow } from '../../contracts/subagent-window/subagent-window-contract';

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export const recordsToGapsTransformer = ({
  records,
  subagentWindows,
  floorSeconds = digestDefaultStatics.gapFloorSeconds,
}: {
  records: readonly TranscriptRecord[];
  subagentWindows: readonly SubagentWindow[];
  floorSeconds?: number;
}): GapReport => {
  const turns = records
    .filter((record) => record.type === 'assistant')
    .flatMap((record) => (record.timestamp === undefined ? [] : [{ timestamp: record.timestamp }]));

  const [firstTurn] = turns;
  const lastTurn = turns[turns.length - 1];

  if (firstTurn === undefined || lastTurn === undefined) {
    return gapReportContract.parse({
      gaps: [],
      wallClockSeconds: 0,
      blockedSeconds: 0,
      idleSeconds: 0,
    });
  }

  const firstTimestampMs = new Date(firstTurn.timestamp).getTime();
  const lastTimestampMs = new Date(lastTurn.timestamp).getTime();

  const candidateGaps = turns.slice(0, -1).flatMap((turn, index) => {
    const nextTurn = turns[index + 1];
    if (nextTurn === undefined) {
      return [];
    }

    const gapStartMs = new Date(turn.timestamp).getTime();
    const gapEndMs = new Date(nextTurn.timestamp).getTime();

    const liveSubagentIds = subagentWindows
      .filter(
        (window) =>
          new Date(window.startedAt).getTime() < gapEndMs &&
          new Date(window.endedAt).getTime() > gapStartMs,
      )
      .map((window) => window.agentId);

    return [
      {
        gapStartedAt: turn.timestamp,
        elapsedMinutes:
          (gapStartMs - firstTimestampMs) / MILLISECONDS_PER_SECOND / SECONDS_PER_MINUTE,
        gapSeconds: (gapEndMs - gapStartMs) / MILLISECONDS_PER_SECOND,
        liveSubagentIds,
      },
    ];
  });

  const survivingGaps = candidateGaps.filter((gap) => gap.gapSeconds >= floorSeconds);

  const blockedSeconds = survivingGaps
    .filter((gap) => gap.liveSubagentIds.length > 0)
    .reduce((sum, gap) => sum + gap.gapSeconds, 0);

  const idleSeconds = survivingGaps
    .filter((gap) => gap.liveSubagentIds.length === 0)
    .reduce((sum, gap) => sum + gap.gapSeconds, 0);

  return gapReportContract.parse({
    gaps: survivingGaps.map((gap) => turnGapContract.parse(gap)),
    wallClockSeconds: (lastTimestampMs - firstTimestampMs) / MILLISECONDS_PER_SECOND,
    blockedSeconds,
    idleSeconds,
  });
};
