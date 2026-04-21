/**
 * PURPOSE: Transforms a WardResult into a detailed view showing errors, failures, crashes, and per-project passing test lists
 *
 * USAGE:
 * resultToDetailTransformer({wardResult: WardResultStub()});
 * // Returns: WardFileDetail with failure details and passing-test blocks per project
 */

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import type { ErrorEntry } from '../../contracts/error-entry/error-entry-contract';
import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';
import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import type { WardFileDetail } from '../../contracts/ward-file-detail/ward-file-detail-contract';
import { wardFileDetailContract } from '../../contracts/ward-file-detail/ward-file-detail-contract';
import { isPathSuffixMatchGuard } from '../../guards/is-path-suffix-match/is-path-suffix-match-guard';
import { extractNetworkLogTransformer } from '../extract-network-log/extract-network-log-transformer';
import { stripAnsiCodesTransformer } from '../strip-ansi-codes/strip-ansi-codes-transformer';

const MS_PER_SECOND = 1000;

export const resultToDetailTransformer = ({
  wardResult,
  filePath,
}: {
  wardResult: WardResult;
  filePath?: ErrorEntry['filePath'] | TestFailure['suitePath'];
}): WardFileDetail => {
  if (filePath) {
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

        for (const passing of project.passingTests) {
          if (isPathSuffixMatchGuard({ storedPath: passing.suitePath, queryPath: filePath })) {
            const durationPart =
              Number(passing.durationMs) > 0 ? ` (${String(passing.durationMs)}ms)` : '';
            entries.push(`  PASS  "${passing.testName}"${durationPart}` as ErrorEntry['message']);
          }
        }

        const rawText = project.rawOutput.stderr || project.rawOutput.stdout;
        const networkLog = extractNetworkLogTransformer({
          rawOutput: errorMessageContract.parse(rawText),
        });
        if (networkLog.length > 0) {
          entries.push(errorMessageContract.parse(`\n  Network Log:\n    ${networkLog}`));
        }
      }
    }

    const raw = entries.length > 0 ? `${filePath}\n${entries.join('\n')}` : String(filePath);
    const output = stripAnsiCodesTransformer({ text: errorMessageContract.parse(raw) });

    return wardFileDetailContract.parse(output);
  }

  const sections: ErrorEntry['message'][] = [];

  for (const check of wardResult.checks) {
    for (const project of check.projectResults) {
      for (const error of project.errors) {
        const rulePart = error.rule ? ` ${error.rule}` : '';
        const locationPart =
          error.line === 0 ? '' : ` (line ${String(error.line)}, col ${String(error.column)})`;
        sections.push(
          errorMessageContract.parse(
            `${error.filePath}\n  ${check.checkType}${rulePart}${locationPart}\n    ${error.message}`,
          ),
        );
      }

      for (const failure of project.testFailures) {
        const stackPart = failure.stackTrace ? `\n    ${failure.stackTrace}` : '';
        const rawTextForLog = project.rawOutput.stderr || project.rawOutput.stdout;
        const networkLogForFailure = extractNetworkLogTransformer({
          rawOutput: errorMessageContract.parse(rawTextForLog),
        });
        const networkPart =
          networkLogForFailure.length > 0 ? `\n\n  Network Log:\n    ${networkLogForFailure}` : '';
        sections.push(
          errorMessageContract.parse(
            `${failure.suitePath}\n  FAIL  "${failure.testName}"\n    ${failure.message}${stackPart}${networkPart}`,
          ),
        );
      }

      if (
        project.status === 'fail' &&
        project.errors.length === 0 &&
        project.testFailures.length === 0
      ) {
        const rawText = project.rawOutput.stderr || project.rawOutput.stdout;
        if (rawText.length > 0) {
          sections.push(
            errorMessageContract.parse(
              `${project.projectFolder.name}\n  (crash) ${check.checkType}\n    ${rawText}`,
            ),
          );
        } else {
          sections.push(
            errorMessageContract.parse(
              `${project.projectFolder.name}\n  (crash) ${check.checkType}\n    no output captured`,
            ),
          );
        }
      }

      if (project.status === 'pass' && project.passingTests.length > 0) {
        const totalDurationMs = project.passingTests.reduce(
          (sum, t) => sum + Number(t.durationMs),
          0,
        );
        const durationPart =
          totalDurationMs >= MS_PER_SECOND
            ? `, ${(totalDurationMs / MS_PER_SECOND).toFixed(1)}s`
            : '';
        const filesPart =
          Number(project.filesCount) > 0 ? `${String(project.filesCount)} files, ` : '';
        const header = `${project.projectFolder.name}\n  ${check.checkType}  PASS  (${filesPart}${String(project.passingTests.length)} tests${durationPart})`;
        const testLines = project.passingTests.map((passing) => {
          const testDurationPart =
            Number(passing.durationMs) > 0 ? ` (${String(passing.durationMs)}ms)` : '';
          return `    ✓ ${passing.suitePath} › ${passing.testName}${testDurationPart}`;
        });
        sections.push(errorMessageContract.parse([header, ...testLines].join('\n')));
      }

      if (project.onlyDiscovered.length > 0) {
        sections.push(
          errorMessageContract.parse(
            `not run (${String(project.onlyDiscovered.length)} files):\n  ${project.onlyDiscovered.join('\n  ')}`,
          ),
        );
      }
    }
  }

  const raw = sections.length > 0 ? sections.join('\n\n') : 'No errors found';
  const output = stripAnsiCodesTransformer({ text: errorMessageContract.parse(raw) });

  return wardFileDetailContract.parse(output);
};
