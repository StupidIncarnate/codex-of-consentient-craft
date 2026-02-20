/**
 * PURPOSE: Transforms a WardResult into an errors-by-file list showing all errors and test failures grouped by file path
 *
 * USAGE:
 * resultToListTransformer({wardResult: WardResultStub()});
 * // Returns: WardErrorList like "src/app.ts\n  lint  no-unused-vars (line 15)"
 */

import type { ErrorEntry } from '../../contracts/error-entry/error-entry-contract';
import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';
import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import type { WardErrorList } from '../../contracts/ward-error-list/ward-error-list-contract';
import { wardErrorListContract } from '../../contracts/ward-error-list/ward-error-list-contract';

export const resultToListTransformer = ({
  wardResult,
}: {
  wardResult: WardResult;
}): WardErrorList => {
  const fileMap = new Map<
    ErrorEntry['filePath'] | TestFailure['suitePath'],
    ErrorEntry['message'][]
  >();

  for (const check of wardResult.checks) {
    for (const project of check.projectResults) {
      for (const error of project.errors) {
        const existing = fileMap.get(error.filePath) ?? [];
        const rulePart = error.rule ? ` ${error.rule}` : '';
        const linePart = error.line === 0 ? '' : ` (line ${String(error.line)})`;
        existing.push(`  ${check.checkType}${rulePart}${linePart}` as ErrorEntry['message']);
        fileMap.set(error.filePath, existing);
      }

      for (const failure of project.testFailures) {
        const existing = fileMap.get(failure.suitePath) ?? [];
        existing.push(
          `  FAIL  "${failure.testName}" - ${failure.message}` as ErrorEntry['message'],
        );
        fileMap.set(failure.suitePath, existing);
      }
    }
  }

  const sections = [...fileMap.entries()].map(
    ([filePath, fileEntries]) => `${filePath}\n${fileEntries.join('\n')}`,
  );

  return wardErrorListContract.parse(sections.join('\n'));
};
