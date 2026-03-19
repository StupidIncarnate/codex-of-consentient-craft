/**
 * PURPOSE: Parses Playwright line reporter stderr output into structured per-test results for ward fallback reporting when JSON output is unavailable
 *
 * USAGE:
 * playwrightLineToResultsTransformer({ output: errorMessageContract.parse(stderrOutput) });
 * // Returns PlaywrightLineResults with passed/failed test titles and total count
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import {
  playwrightLineResultsContract,
  type PlaywrightLineResults,
} from '../../contracts/playwright-line-results/playwright-line-results-contract';

const PASS_PATTERN = /^\s*(?:\d+ )?\u2713\s+(.+)$/u;
const FAIL_PATTERN = /^\s*(?:\d+ )?(?:\u2717|\u00d7)\s+(.+)$/u;

export const playwrightLineToResultsTransformer = ({
  output,
}: {
  output: ErrorMessage;
}): PlaywrightLineResults => {
  const lines = String(output).split('\n');
  const passed: unknown[] = [];
  const failed: unknown[] = [];

  for (const line of lines) {
    const passMatch = PASS_PATTERN.exec(line);
    const passTitle = passMatch?.[1];
    if (passTitle) {
      passed.push(passTitle.trim());
      continue;
    }

    const failMatch = FAIL_PATTERN.exec(line);
    const failTitle = failMatch?.[1];
    if (failTitle) {
      failed.push(failTitle.trim());
    }
  }

  return playwrightLineResultsContract.parse({
    passed,
    failed,
    total: passed.length + failed.length,
  });
};
