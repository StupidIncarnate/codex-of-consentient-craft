/**
 * PURPOSE: Picks the suites a check should call slow, ranked worst first. Reach for this from BOTH
 * the summary and the verdict — the list ward prints and the list ward fails on have to be the same
 * list, and they only stay the same by coming from here.
 *
 * RANKED ON TEST TIME, never on wall. Wall is jest's `endTime - startTime`, which spans the
 * package's one-time compile and its module evaluation, both charged to whichever suite reaches a
 * module FIRST. Measured: one mcp file read 30.6s wall running first and 1.9s running last, the same
 * tests either way, while that package's one genuinely slow file sat at 2.9s of test bodies in every
 * order. A check that reports no per-test durations at all — lint — has only wall, and keeps the
 * wall threshold.
 *
 * USAGE:
 * slowFileTimingsTransformer({check: CheckResultStub()});
 * // Returns the FileTiming entries over threshold, slowest first
 */

import type { CheckResult } from '../../contracts/check-result/check-result-contract';
import type { FileTiming } from '../../contracts/file-timing/file-timing-contract';
import { slowFileThresholdStatics } from '../../statics/slow-file-threshold/slow-file-threshold-statics';

export const slowFileTimingsTransformer = ({ check }: { check: CheckResult }): FileTiming[] => {
  if (check.status === 'skip') {
    return [];
  }

  const allTimings: FileTiming[] = check.projectResults.flatMap(
    (projectResult) => projectResult.fileTimings,
  );
  const hasTestMs = allTimings.some((timing) => Number(timing.testMs) > 0);

  if (!hasTestMs) {
    return allTimings
      .filter((timing) => Number(timing.durationMs) > slowFileThresholdStatics.threshold.warnMs)
      .sort((left, right) => Number(right.durationMs) - Number(left.durationMs));
  }

  return allTimings
    .filter((timing) => Number(timing.testMs) > slowFileThresholdStatics.threshold.testWarnMs)
    .sort((left, right) => Number(right.testMs) - Number(left.testMs));
};
