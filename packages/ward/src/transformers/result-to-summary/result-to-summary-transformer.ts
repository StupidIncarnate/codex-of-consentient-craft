/**
 * PURPOSE: Transforms a WardResult into a compact summary string showing pass/fail/skip per check type
 *
 * USAGE:
 * resultToSummaryTransformer({wardResult: WardResultStub()});
 * // Returns: WardSummary like "run: 1739625600000-a3f1\nlint:      PASS  10 packages"
 */

import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import type { WardSummary } from '../../contracts/ward-summary/ward-summary-contract';
import { wardSummaryContract } from '../../contracts/ward-summary/ward-summary-contract';

const CHECK_TYPE_PAD = 10;

export const resultToSummaryTransformer = ({
  wardResult,
}: {
  wardResult: WardResult;
}): WardSummary => {
  const runLine = `run: ${wardResult.runId}`;

  const checkLines = wardResult.checks.map((check) => {
    const label = `${check.checkType}:`.padEnd(CHECK_TYPE_PAD);

    if (check.status === 'pass') {
      const passCount = check.projectResults.filter((pr) => pr.status === 'pass').length;
      return `${label} PASS  ${String(passCount)} packages`;
    }

    if (check.status === 'fail') {
      const failing = check.projectResults
        .filter((pr) => pr.status === 'fail')
        .map((pr) => {
          const failureCount = pr.testFailures.length + pr.errors.length;
          return `${pr.projectFolder.name} (${String(failureCount)} failures)`;
        });
      return `${label} FAIL  ${failing.join(', ')}`;
    }

    const skipped = check.projectResults
      .filter((pr) => pr.status === 'skip')
      .map((pr) => `${pr.projectFolder.name} (${pr.rawOutput.stderr || 'skipped'})`);
    return `${label} SKIP  ${skipped.join(', ')}`;
  });

  return wardSummaryContract.parse([runLine, ...checkLines].join('\n'));
};
