/**
 * PURPOSE: Picks the suites a check should call slow, ranked worst first. Reach for this from BOTH
 * the summary and the verdict — the list ward prints and the list ward fails on have to be the same
 * list, and they only stay the same by coming from here.
 *
 * RANKED ON THE SLOWEST SINGLE TEST, never on wall and never on the sum.
 *
 * Wall is jest's `endTime - startTime`, which spans the package's one-time compile and its module
 * evaluation, both charged to whichever suite reaches a module FIRST. Measured: one mcp file read
 * 30.6s wall running first and 1.9s running last, the same tests either way. Lint has the identical
 * failure mode in `parse` and the identical fix in `rulesMs` — a 40-file web batch read 8.5s wall
 * on a file whose own rule work was 0.5s — so lint ranks on rule time and never falls back to wall.
 * Only a jest check whose every suite reported a null duration reaches the wall threshold.
 *
 * The SUM of a suite's tests is no better, for a different reason: it grades a file on how many
 * tests it holds. `execution-panel-widget.test.tsx` is 153 tests at about 18ms each, so it tripped
 * a one-second bar while holding nothing slower than 165ms — and the cheapest way to pass a bar
 * like that is to delete tests. Across the thirteen slowest unit files in this repo the worst
 * single test measured 413ms, so the sum was reporting file size and machine load rather than any
 * slow test. One test sitting through a real three-second retry is the shape worth catching, and
 * the worst-single-test figure is what catches it.
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

  const hasTestMs = allTimings.some((timing) => Number(timing.slowestTestMs) > 0);

  if (!hasTestMs) {
    return allTimings
      .filter((timing) => Number(timing.durationMs) > slowFileThresholdStatics.threshold.warnMs)
      .sort((left, right) => Number(right.durationMs) - Number(left.durationMs));
  }

  // Three bars, because the three jest-shaped checks measure different work. A browser spec
  // navigates, waits for real paint and talks to a real server; an integration test may spawn real
  // processes, and a spawned child costs about a second here before doing anything of its own.
  // Holding either to the unit bar would name every file and say nothing.
  const jestBar =
    check.checkType === 'integration'
      ? slowFileThresholdStatics.threshold.integrationTestWarnMs
      : slowFileThresholdStatics.threshold.testWarnMs;
  const bar =
    check.checkType === 'e2e' ? slowFileThresholdStatics.threshold.e2eTestWarnMs : jestBar;

  // Matched on the END of the path, because jest reports an absolute one and an allowance is
  // written repo-relative. A file with an allowance is measured against ITS number rather than the
  // bar, so a known price is excused and a regression past it still fails.
  const allowances = Object.entries(slowFileThresholdStatics.allowed);

  return allTimings
    .filter((timing) => {
      const allowance = allowances.find(([path]) => String(timing.filePath).endsWith(path));
      const limit = allowance === undefined ? bar : allowance[1].slowestTestMs;
      return Number(timing.slowestTestMs) > limit;
    })
    .sort((left, right) => Number(right.slowestTestMs) - Number(left.slowestTestMs));
};
