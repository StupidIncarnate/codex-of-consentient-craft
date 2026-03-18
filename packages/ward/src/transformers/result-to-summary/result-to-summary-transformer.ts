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
import { countFailingFilesTransformer } from '../count-failing-files/count-failing-files-transformer';
import { discoveryDiffDisplayTransformer } from '../discovery-diff-display/discovery-diff-display-transformer';

const CHECK_TYPE_PAD = 10;

export const resultToSummaryTransformer = ({
  wardResult,
  cwd,
}: {
  wardResult: WardResult;
  cwd: AbsoluteFilePath;
}): WardSummary => {
  const runLine = `run: ${wardResult.runId}`;

  const hasPassthrough =
    Array.isArray(wardResult.filters.passthrough) && wardResult.filters.passthrough.length > 0;

  const checkLines = wardResult.checks.flatMap((check) => {
    if (check.status === 'skip') {
      return [];
    }

    const label = `${check.checkType}:`.padEnd(CHECK_TYPE_PAD);
    const totalFiles = check.projectResults.reduce((sum, pr) => sum + pr.filesCount, 0);
    const totalDiscovered = check.projectResults.reduce((sum, pr) => sum + pr.discoveredCount, 0);
    const totalFailingFiles = check.projectResults.reduce(
      (sum, pr) => sum + countFailingFilesTransformer({ projectResult: pr }),
      0,
    );
    const fileBreakdown = `${String(totalFiles - totalFailingFiles)} files passed/${String(totalFailingFiles)} files failed`;
    const discoveredPart = totalDiscovered > 0 ? `, ${String(totalDiscovered)} discovered` : '';
    const isScopedWithResults = hasPassthrough && totalFiles > 0;
    const hasMismatch =
      !isScopedWithResults && totalDiscovered > 0 && totalDiscovered !== totalFiles;
    const mismatchPart = hasMismatch ? '  DISCOVERY MISMATCH' : '';

    const allOnlyDiscovered = check.projectResults.flatMap((pr) => pr.onlyDiscovered);
    const allOnlyProcessed = check.projectResults.flatMap((pr) => pr.onlyProcessed);

    const MAX_DIFF_SUMMARY = 10;
    const diffPart = discoveryDiffDisplayTransformer({
      hasMismatch,
      onlyProcessed: allOnlyProcessed,
      onlyDiscovered: allOnlyDiscovered,
      maxDisplay: MAX_DIFF_SUMMARY,
    });

    if (totalFiles === 0) {
      const statusWord = check.status === 'fail' ? 'FAIL' : 'WARN';
      const zeroDiscoveredPart =
        totalDiscovered > 0 ? `, ${String(totalDiscovered)} discovered  DISCOVERY MISMATCH` : '';
      const zeroDiffPart = totalDiscovered > 0 ? diffPart : '';
      return [`${label} ${statusWord}  0 files run${zeroDiscoveredPart}${zeroDiffPart}`];
    }

    if (check.status === 'pass') {
      const passCount = check.projectResults.filter((pr) => pr.status === 'pass').length;
      return [
        `${label} PASS  ${String(passCount)} packages (${fileBreakdown}${discoveredPart})${mismatchPart}${diffPart}`,
      ];
    }

    const totalPackages = check.projectResults.length;
    const failingNames = check.projectResults
      .filter((pr) => pr.status === 'fail')
      .map((pr) => {
        const failureCount = pr.testFailures.length + pr.errors.length;
        if (failureCount === 0) {
          return `${pr.projectFolder.name} (crash)`;
        }
        return `${pr.projectFolder.name} (${String(failureCount)})`;
      });
    const failPart = failingNames.length > 0 ? `  ${failingNames.join(', ')}` : '';
    return [
      `${label} FAIL  ${String(totalPackages)} packages (${fileBreakdown}${discoveredPart})${failPart}${mismatchPart}${diffPart}`,
    ];
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
        const linePart = error.line === 0 ? '' : ` (line ${error.line})`;
        return `${displayPath}\n  ${rulePart}${error.message}${linePart}`;
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

      if (project.status === 'fail' && errorLines.length === 0 && failureLines.length === 0) {
        const MAX_CRASH_OUTPUT = 200;
        const rawText = project.rawOutput.stderr || project.rawOutput.stdout;
        const truncated =
          rawText.length > MAX_CRASH_OUTPUT
            ? `${rawText.slice(0, MAX_CRASH_OUTPUT)}...`
            : String(rawText);
        if (truncated.length > 0) {
          return [`${project.projectFolder.name}\n  (crash) ${truncated}`];
        }
        return [`${project.projectFolder.name}\n  (crash) no output captured`];
      }

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
