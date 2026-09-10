/**
 * PURPOSE: Picks the suites a check should call slow, ranked worst first. Reach for this from BOTH
 * the summary and the verdict — the list ward prints and the list ward fails on have to be the same
 * list, and they only stay the same by coming from here.
 *
 * RANKED ON THE FILE'S OWN COST, never on wall. Wall is jest's `endTime - startTime`, which spans
 * the package's one-time compile and its module evaluation, both charged to whichever suite reaches
 * a module FIRST. Measured: one mcp file read 30.6s wall running first and 1.9s running last, the
 * same tests either way, while that package's one genuinely slow file sat at 2.9s of test bodies in
 * every order. Lint has the identical failure mode in `parse` and the identical fix in `rulesMs` —
 * a 40-file web batch read 8.5s wall on a file whose own rule work was 0.5s — so lint ranks on rule
 * time and never falls back to wall. Only a jest check whose every suite reported a null duration
 * reaches the wall threshold.
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

  // Every lint timing carries its own number, because `eslintStatsParseTransformer` emits an entry
  // only for a file eslint reported `stats.times.passes` for, and that is the same place `rules`
  // comes from. So there is no lint case left where wall is the best available figure.
  if (check.checkType === 'lint') {
    return allTimings
      .filter(
        (timing) => Number(timing.rulesMs) > slowFileThresholdStatics.threshold.lintRulesWarnMs,
      )
      .sort((left, right) => Number(right.rulesMs) - Number(left.rulesMs));
  }

  const hasTestMs = allTimings.some((timing) => Number(timing.testMs) > 0);

  if (!hasTestMs) {
    return allTimings
      .filter((timing) => Number(timing.durationMs) > slowFileThresholdStatics.threshold.warnMs)
      .sort((left, right) => Number(right.durationMs) - Number(left.durationMs));
  }

  // A browser spec navigates, waits for real paint and talks to a real server, so holding it to the
  // jest bar would name every spec in the package and say nothing.
  const bar =
    check.checkType === 'e2e'
      ? slowFileThresholdStatics.threshold.e2eTestWarnMs
      : slowFileThresholdStatics.threshold.testWarnMs;

  return allTimings
    .filter((timing) => Number(timing.testMs) > bar)
    .sort((left, right) => Number(right.testMs) - Number(left.testMs));
};
