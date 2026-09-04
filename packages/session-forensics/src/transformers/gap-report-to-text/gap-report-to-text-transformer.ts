/**
 * PURPOSE: A `GapReport` is data a program can cross with sub-agent windows; a human staring at a
 * possibly-stalled quest needs the prose a CLI prints. This is the one place that turns the report
 * into that text, and it is the only renderer that prints `*** NOTHING RUNNING ***` on a gap whose
 * `liveSubagentIds` is empty. That marker is the entire point of the report: it is what separates a
 * session blocked on real sub-agent work from one that is genuinely stalled, and on a real quest
 * drawing that line moved the headline figure from "67-94% idle" down to "~1% true dead air."
 *
 * USAGE:
 * gapReportToTextTransformer({ report: GapReportStub() });
 * // Returns ContentText: the "GAPS >= Ns" header, one line per surviving gap, then the WALL CLOCK /
 * // IN GAPS / blocked-on-sub / TRUE IDLE summary
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import { digestDefaultStatics } from '../../statics/digest-default/digest-default-statics';
import type { GapReport } from '../../contracts/gap-report/gap-report-contract';

const SECONDS_PER_MINUTE = 60;
const PERCENT_MULTIPLIER = 100;
const NOTHING_RUNNING_MARKER = '*** NOTHING RUNNING ***';

export const gapReportToTextTransformer = ({
  report,
  floorSeconds = digestDefaultStatics.gapFloorSeconds,
}: {
  report: GapReport;
  floorSeconds?: number;
}): ContentText => {
  const inGapsSeconds = report.blockedSeconds + report.idleSeconds;

  const inGapsPercent =
    report.wallClockSeconds === 0
      ? 0
      : (inGapsSeconds / report.wallClockSeconds) * PERCENT_MULTIPLIER;
  const blockedPercent =
    report.wallClockSeconds === 0
      ? 0
      : (report.blockedSeconds / report.wallClockSeconds) * PERCENT_MULTIPLIER;
  const idlePercent =
    report.wallClockSeconds === 0
      ? 0
      : (report.idleSeconds / report.wallClockSeconds) * PERCENT_MULTIPLIER;

  const lines = [
    `GAPS >= ${floorSeconds}s between assistant turns`,
    'AT        GAP      LIVE SUB-AGENTS',
    ...report.gaps.map((gap) => {
      const names =
        gap.liveSubagentIds.length === 0 ? NOTHING_RUNNING_MARKER : gap.liveSubagentIds.join('; ');
      return `${gap.elapsedMinutes.toFixed(1)}m ${Math.round(gap.gapSeconds)}s  ${names}`;
    }),
    '',
    `WALL CLOCK      ${(report.wallClockSeconds / SECONDS_PER_MINUTE).toFixed(1)} min`,
    `IN GAPS         ${(inGapsSeconds / SECONDS_PER_MINUTE).toFixed(1)} min  (${inGapsPercent.toFixed(1)}%)`,
    `  blocked on sub  ${(report.blockedSeconds / SECONDS_PER_MINUTE).toFixed(1)} min  (${blockedPercent.toFixed(1)}%)`,
    `  TRUE IDLE       ${(report.idleSeconds / SECONDS_PER_MINUTE).toFixed(1)} min  (${idlePercent.toFixed(1)}%)`,
  ];

  return contentTextContract.parse(lines.join('\n'));
};
