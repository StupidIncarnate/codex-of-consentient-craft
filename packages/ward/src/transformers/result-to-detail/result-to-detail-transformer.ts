/**
 * PURPOSE: Transforms a WardResult into a detailed error view for a specific file path with optional stack trace truncation
 *
 * USAGE:
 * resultToDetailTransformer({wardResult: WardResultStub(), filePath: ErrorEntryStub().filePath});
 * // Returns: WardFileDetail with all errors and test failures for that file
 */

import type { ErrorEntry } from '../../contracts/error-entry/error-entry-contract';
import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';
import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import type { WardFileDetail } from '../../contracts/ward-file-detail/ward-file-detail-contract';
import { wardFileDetailContract } from '../../contracts/ward-file-detail/ward-file-detail-contract';
import { stackTraceTruncateTransformer } from '../stack-trace-truncate/stack-trace-truncate-transformer';

export const resultToDetailTransformer = ({
  wardResult,
  filePath,
  verbose,
}: {
  wardResult: WardResult;
  filePath: ErrorEntry['filePath'] | TestFailure['suitePath'];
  verbose?: boolean;
}): WardFileDetail => {
  const entries: ErrorEntry['message'][] = [];

  for (const check of wardResult.checks) {
    for (const project of check.projectResults) {
      for (const error of project.errors) {
        if (String(error.filePath) === String(filePath)) {
          const rulePart = error.rule ? ` ${error.rule}` : '';
          const locationPart =
            error.line === 0 ? '' : ` (line ${String(error.line)}, col ${String(error.column)})`;
          entries.push(`  ${check.checkType}${rulePart}${locationPart}` as ErrorEntry['message']);
          entries.push(`    ${error.message}` as ErrorEntry['message']);
        }
      }

      for (const failure of project.testFailures) {
        if (String(failure.suitePath) === String(filePath)) {
          entries.push(`  FAIL  "${failure.testName}"` as ErrorEntry['message']);
          entries.push(`    ${failure.message}` as ErrorEntry['message']);

          if (failure.stackTrace) {
            const stack = verbose
              ? failure.stackTrace
              : stackTraceTruncateTransformer({ stackTrace: failure.stackTrace });
            entries.push(`    ${stack}` as ErrorEntry['message']);
          }
        }
      }
    }
  }

  const output = entries.length > 0 ? `${filePath}\n${entries.join('\n')}` : String(filePath);

  return wardFileDetailContract.parse(output);
};
