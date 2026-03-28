/**
 * PURPOSE: Extracts the first meaningful line from an error message, skipping useless timeout noise
 *
 * USAGE:
 * firstMeaningfulLineTransformer({ message: testFailureContract.shape.message.parse('Error: thrown: "\nActual error') });
 * // Returns 'Actual error' as SummaryLine
 */

import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';
import type { SummaryLine } from '../../contracts/summary-line/summary-line-contract';
import { summaryLineContract } from '../../contracts/summary-line/summary-line-contract';
import { isUselessErrorLineGuard } from '../../guards/is-useless-error-line/is-useless-error-line-guard';

export const firstMeaningfulLineTransformer = ({
  message,
}: {
  message: TestFailure['message'];
}): SummaryLine => {
  const lines = message.split('\n');
  const meaningful = lines.find((line) => !isUselessErrorLineGuard({ line }));

  return summaryLineContract.parse(meaningful ?? lines[0] ?? '(no error message)');
};
