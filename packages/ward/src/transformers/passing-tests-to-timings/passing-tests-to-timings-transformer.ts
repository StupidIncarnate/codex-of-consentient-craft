/**
 * PURPOSE: Rolls per-test durations up into one timing per suite file. Reach for this where the
 * runner reports tests but not files — Playwright's JSON report is per test, while ward's slow-file
 * list and its slow-file verdict both work in suites.
 *
 * Both numbers come out the same, and deliberately: Playwright reports each test's own execution
 * time and excludes the browser boot, so there is no wall figure carrying a startup cost the way a
 * jest suite's `endTime - startTime` carries a compile.
 *
 * USAGE:
 * passingTestsToTimingsTransformer({passingTests: [PassingTestStub()]});
 * // Returns one FileTiming per distinct suitePath, summed
 */

import { fileTimingContract } from '../../contracts/file-timing/file-timing-contract';
import type { FileTiming } from '../../contracts/file-timing/file-timing-contract';
import type { PassingTest } from '../../contracts/passing-test/passing-test-contract';

export const passingTestsToTimingsTransformer = ({
  passingTests,
}: {
  passingTests: readonly PassingTest[];
}): FileTiming[] => {
  const paths = [...new Set(passingTests.map((test) => String(test.suitePath)))];

  return paths.map((path) => {
    const total = passingTests
      .filter((test) => String(test.suitePath) === path)
      .reduce((sum, test) => sum + Number(test.durationMs), 0);

    return fileTimingContract.parse({ filePath: path, durationMs: total, testMs: total });
  });
};
