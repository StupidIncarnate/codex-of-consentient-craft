/**
 * PURPOSE: Transforms a WardResult into a detailed error view for a specific file path showing full untruncated output
 *
 * USAGE:
 * resultToDetailTransformer({wardResult: WardResultStub(), filePath: ErrorEntryStub().filePath});
 * // Returns: WardFileDetail with all errors and test failures for that file
 */

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import type { ErrorEntry } from '../../contracts/error-entry/error-entry-contract';
import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';
import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import type { WardFileDetail } from '../../contracts/ward-file-detail/ward-file-detail-contract';
import { wardFileDetailContract } from '../../contracts/ward-file-detail/ward-file-detail-contract';
import { isPathSuffixMatchGuard } from '../../guards/is-path-suffix-match/is-path-suffix-match-guard';
import { stripAnsiCodesTransformer } from '../strip-ansi-codes/strip-ansi-codes-transformer';

export const resultToDetailTransformer = ({
  wardResult,
  filePath,
}: {
  wardResult: WardResult;
  filePath: ErrorEntry['filePath'] | TestFailure['suitePath'];
}): WardFileDetail => {
  const entries: ErrorEntry['message'][] = [];

  for (const check of wardResult.checks) {
    for (const project of check.projectResults) {
      for (const error of project.errors) {
        if (isPathSuffixMatchGuard({ storedPath: error.filePath, queryPath: filePath })) {
          const rulePart = error.rule ? ` ${error.rule}` : '';
          const locationPart =
            error.line === 0 ? '' : ` (line ${String(error.line)}, col ${String(error.column)})`;
          entries.push(`  ${check.checkType}${rulePart}${locationPart}` as ErrorEntry['message']);
          entries.push(`    ${error.message}` as ErrorEntry['message']);
        }
      }

      for (const failure of project.testFailures) {
        if (isPathSuffixMatchGuard({ storedPath: failure.suitePath, queryPath: filePath })) {
          entries.push(`  FAIL  "${failure.testName}"` as ErrorEntry['message']);
          entries.push(`    ${failure.message}` as ErrorEntry['message']);
        }
      }
    }
  }

  const raw = entries.length > 0 ? `${filePath}\n${entries.join('\n')}` : String(filePath);
  const output = stripAnsiCodesTransformer({ text: errorMessageContract.parse(raw) });

  return wardFileDetailContract.parse(output);
};
