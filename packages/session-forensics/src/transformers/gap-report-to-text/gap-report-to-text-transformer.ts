/**
 * PURPOSE: A `GapReport` is data: a program can cross it against sub-agent windows. A human looking
 * at a possibly-stalled quest needs prose instead. This transformer renders that prose. It is the
 * only renderer that prints `*** NOTHING RUNNING ***` on a gap whose `liveSubagentIds` list is
 * empty. That marker is the entire point of the report. It separates a session blocked on real
 * sub-agent work from one that is genuinely stalled. On a real quest, drawing that line moved the
 * headline figure from "67-94% idle" down to "~1% true dead air."
 *
 * USAGE:
 * gapReportToTextTransformer({ report: GapReportStub() });
 * // Returns ContentText: a header explaining what a gap is, one line per surviving gap, then a
 * // summary splitting the run into time spent waiting on a sub-agent and time with nothing running
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
    `Gaps of ${floorSeconds} seconds or more between one model reply and the next.`,
    'A gap that names sub-agents is time the session spent waiting on a helper.',
    `A gap marked ${NOTHING_RUNNING_MARKER} had nothing happening at all.`,
    'Minutes in  Gap      Sub-agents running',
    ...report.gaps.map((gap) => {
      const names =
        gap.liveSubagentIds.length === 0 ? NOTHING_RUNNING_MARKER : gap.liveSubagentIds.join('; ');
      return `${gap.elapsedMinutes.toFixed(1)}m ${Math.round(gap.gapSeconds)}s  ${names}`;
    }),
    '',
    `Ran for                 ${(report.wallClockSeconds / SECONDS_PER_MINUTE).toFixed(1)} minutes`,
    `Spent in gaps           ${(inGapsSeconds / SECONDS_PER_MINUTE).toFixed(1)} minutes  (${inGapsPercent.toFixed(1)}%)`,
    `  waiting on a sub-agent  ${(report.blockedSeconds / SECONDS_PER_MINUTE).toFixed(1)} minutes  (${blockedPercent.toFixed(1)}%)`,
    `  nothing running at all  ${(report.idleSeconds / SECONDS_PER_MINUTE).toFixed(1)} minutes  (${idlePercent.toFixed(1)}%)`,
  ];

  return contentTextContract.parse(lines.join('\n'));
};
