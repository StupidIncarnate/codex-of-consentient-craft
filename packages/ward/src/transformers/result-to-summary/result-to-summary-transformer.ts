/**
 * PURPOSE: Transforms a WardResult into a compact summary string showing pass/fail/skip per check type
 *
 * USAGE:
 * resultToSummaryTransformer({wardResult: WardResultStub()});
 * // Returns: WardSummary like "run: 1739625600000-a3f1\nlint:      PASS  10 packages"
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { errorEntryContract } from '../../contracts/error-entry/error-entry-contract';
import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import type { WardSummary } from '../../contracts/ward-summary/ward-summary-contract';
import { wardSummaryContract } from '../../contracts/ward-summary/ward-summary-contract';
import { toCwdRelativePathTransformer } from '../to-cwd-relative-path/to-cwd-relative-path-transformer';

const CHECK_TYPE_PAD = 10;

export const resultToSummaryTransformer = ({
  wardResult,
  cwd,
}: {
  wardResult: WardResult;
  cwd: AbsoluteFilePath;
}): WardSummary => {
  const runLine = `run: ${wardResult.runId}`;

  const checkLines = wardResult.checks.map((check) => {
    const label = `${check.checkType}:`.padEnd(CHECK_TYPE_PAD);
    const totalFiles = check.projectResults.reduce((sum, pr) => sum + pr.filesCount, 0);

    if (check.status !== 'skip' && totalFiles === 0) {
      return `${label} WARN  0 files run`;
    }

    if (check.status === 'pass') {
      const passCount = check.projectResults.filter((pr) => pr.status === 'pass').length;
      return `${label} PASS  ${String(passCount)} packages (${String(totalFiles)} files)`;
    }

    if (check.status === 'fail') {
      const totalPackages = check.projectResults.length;
      const failingNames = check.projectResults
        .filter((pr) => pr.status === 'fail')
        .filter((pr) => pr.errors.length > 0 || pr.testFailures.length > 0)
        .map((pr) => {
          const failureCount = pr.testFailures.length + pr.errors.length;
          return `${pr.projectFolder.name} (${String(failureCount)})`;
        });
      const failPart = failingNames.length > 0 ? `  ${failingNames.join(', ')}` : '';
      return `${label} FAIL  ${String(totalPackages)} packages (${String(totalFiles)} files)${failPart}`;
    }

    const skipped = check.projectResults
      .filter((pr) => pr.status === 'skip')
      .map((pr) => `${pr.projectFolder.name} (${pr.rawOutput.stderr || 'skipped'})`);
    return `${label} SKIP  ${skipped.join(', ')}`;
  });

  const detailLines = wardResult.checks.flatMap((check) => {
    if (check.status !== 'fail') {
      return [];
    }

    const fileEntries = check.projectResults.flatMap((project) => {
      const errorLines = project.errors.map((error) => {
        const displayPath = toCwdRelativePathTransformer({
          filePath: error.filePath,
          projectPath: project.projectFolder.path,
          cwd,
        });
        const rulePart = error.rule ? `${error.rule} ` : '';
        return `${displayPath}\n  ${rulePart}${error.message} (line ${error.line})`;
      });

      const failureLines = project.testFailures.map((failure) => {
        const displayPath = toCwdRelativePathTransformer({
          filePath: errorEntryContract.shape.filePath.parse(failure.suitePath),
          projectPath: project.projectFolder.path,
          cwd,
        });
        const [firstLine] = failure.message.split('\n');
        return `${displayPath}\n  FAIL "${failure.testName}"\n    ${firstLine}`;
      });

      return [...errorLines, ...failureLines];
    });

    if (fileEntries.length === 0) {
      return [];
    }

    return [`\n--- ${check.checkType} ---\n${fileEntries.join('\n')}`];
  });

  const summaryLines = [runLine, ...checkLines];

  return wardSummaryContract.parse([...summaryLines, ...detailLines].join('\n'));
};
