/**
 * PURPOSE: Transforms a WardResult into a compact summary string showing pass/fail/skip per check type
 *
 * USAGE:
 * resultToSummaryTransformer({wardResult: WardResultStub()});
 * // Returns: WardSummary like "run: 1739625600000-a3f1\nlint:      PASS  10 packages"
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { errorEntryContract } from '../../contracts/error-entry/error-entry-contract';
import type { FileTiming } from '../../contracts/file-timing/file-timing-contract';
import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import type { WardSummary } from '../../contracts/ward-summary/ward-summary-contract';
import { wardSummaryContract } from '../../contracts/ward-summary/ward-summary-contract';
import { slowFileThresholdStatics } from '../../statics/slow-file-threshold/slow-file-threshold-statics';
import { countFailingFilesTransformer } from '../count-failing-files/count-failing-files-transformer';
import { discoveryDiffDisplayTransformer } from '../discovery-diff-display/discovery-diff-display-transformer';
import { firstMeaningfulLineTransformer } from '../first-meaningful-line/first-meaningful-line-transformer';
import { toCwdRelativePathTransformer } from '../to-cwd-relative-path/to-cwd-relative-path-transformer';
import { hasCheckDiscoveryMismatchGuard } from '../../guards/has-check-discovery-mismatch/has-check-discovery-mismatch-guard';
import { isCrashedProjectResultGuard } from '../../guards/is-crashed-project-result/is-crashed-project-result-guard';

const CHECK_TYPE_PAD = 10;
const MS_PER_SECOND = 1000;

// Enough of an open handle's stack to name the adapter that opened it and the path that reached it,
// without turning one leak into a screenful.
const MAX_HANDLE_FRAMES = 3;

export const resultToSummaryTransformer = ({
  wardResult,
  cwd,
}: {
  wardResult: WardResult;
  cwd: AbsoluteFilePath;
}): WardSummary => {
  const totalDurationSuffix =
    Number(wardResult.durationMs) > 0
      ? `  (${(Number(wardResult.durationMs) / MS_PER_SECOND).toFixed(1)}s)`
      : '';
  const runLine = `run: ${wardResult.runId}${totalDurationSuffix}`;

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
    const hasMismatch = hasCheckDiscoveryMismatchGuard({ check, hasPassthrough });
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

    const checkDurationPart =
      Number(check.durationMs) > 0
        ? `  ${(Number(check.durationMs) / MS_PER_SECOND).toFixed(1)}s`
        : '';

    if (totalFiles === 0) {
      const statusWord = check.status === 'fail' ? 'FAIL' : 'WARN';
      const zeroDiscoveredPart =
        totalDiscovered > 0 ? `, ${String(totalDiscovered)} discovered  DISCOVERY MISMATCH` : '';
      const zeroDiffPart = totalDiscovered > 0 ? diffPart : '';
      return [
        `${label} ${statusWord}  0 files run${zeroDiscoveredPart}${zeroDiffPart}${checkDurationPart}`,
      ];
    }

    if (check.status === 'pass') {
      const passCount = check.projectResults.filter((pr) => pr.status === 'pass').length;
      return [
        `${label} PASS  ${String(passCount)} packages (${fileBreakdown}${discoveredPart})${mismatchPart}${diffPart}${checkDurationPart}`,
      ];
    }

    const totalPackages = check.projectResults.length;
    const failingNames = check.projectResults
      .filter((pr) => pr.status === 'fail')
      .map((pr) => {
        if (isCrashedProjectResultGuard({ projectResult: pr })) {
          return `${pr.projectFolder.name} (crash)`;
        }
        const failureCount = pr.testFailures.length + pr.errors.length;
        return `${pr.projectFolder.name} (${String(failureCount)})`;
      });
    const failPart = failingNames.length > 0 ? `  ${failingNames.join(', ')}` : '';
    return [
      `${label} FAIL  ${String(totalPackages)} packages (${fileBreakdown}${discoveredPart})${failPart}${mismatchPart}${diffPart}${checkDurationPart}`,
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
        const summaryLine = firstMeaningfulLineTransformer({ message: failure.message });
        return `${displayPath}\n  FAIL "${failure.testName}"\n    ${summaryLine}`;
      });

      if (isCrashedProjectResultGuard({ projectResult: project })) {
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

  const slowFileLines = wardResult.checks.flatMap((check) => {
    if (check.status === 'skip') {
      return [];
    }

    const allTimings: FileTiming[] = check.projectResults.flatMap((pr) => pr.fileTimings);
    const slowTimings = allTimings
      .filter((ft) => Number(ft.durationMs) > slowFileThresholdStatics.threshold.warnMs)
      .sort((a, b) => Number(b.durationMs) - Number(a.durationMs));

    if (slowTimings.length === 0) {
      return [];
    }

    // Both numbers, because wall time alone accuses the wrong file. It spans the ts-jest
    // LanguageService and TypeScript program construction, which whichever file jest transforms
    // FIRST pays on the whole package's behalf: one file measured 46.2s wall against 83ms of test
    // bodies, and forcing a different file to run first moved the entire cost onto that one
    // instead. A big gap between the two numbers means the file is not the problem.
    // Only jest reports per-test durations, so lint timings carry no second number and get no
    // note — there is no compile for a first file to absorb there.
    const hasTestMs = slowTimings.some((ft) => Number(ft.testMs) > 0);
    const fileLines = slowTimings.map((ft) => {
      const wall = `${(Number(ft.durationMs) / MS_PER_SECOND).toFixed(1)}s`;
      if (!hasTestMs) {
        return `  ${ft.filePath}  ${wall}`;
      }
      return `  ${ft.filePath}  ${wall} wall, ${(Number(ft.testMs) / MS_PER_SECOND).toFixed(1)}s in tests`;
    });
    const note = hasTestMs
      ? `\n  wall time includes the package's one-time compile, charged to whichever file ran first`
      : '';
    return [`\n--- slow files (${check.checkType}) ---${note}\n${fileLines.join('\n')}`];
  });

  // Jest can only collect these from the main thread, so they arrive from FILE-scoped runs and
  // never from a worker run. Reported, not failed: one orchestrator suite leaks an interval on
  // purpose, so reddening on sight would make the signal something people learn to skip past.
  const openHandleLines = wardResult.checks.flatMap((check) => {
    const handles = check.projectResults.flatMap((projectResult) =>
      projectResult.openHandles.map((handle) => ({
        packageName: String(projectResult.projectFolder.name),
        handle,
      })),
    );

    if (handles.length === 0) {
      return [];
    }

    const handleLines = handles.map(({ packageName, handle }) => {
      const frames = String(handle.stack)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('at '));
      // Every one of these stacks opens with node's own plumbing — `emitInitNative`,
      // `initAsyncResource`, `setInterval` — and closes with jest's runtime, and neither end names
      // the leak. The frames BETWEEN them are the caller's own code, and the chain matters more
      // than any single frame: the adapter that opened the handle says what leaked, its callers say
      // which code path got there. Falls back to the raw first frame when a handle was opened
      // entirely inside a dependency, so a line still prints.
      const ownFrames = frames.filter(
        (line) => !line.includes('node:') && !line.includes('node_modules'),
      );
      const shown =
        ownFrames.length > 0 ? ownFrames.slice(0, MAX_HANDLE_FRAMES) : frames.slice(0, 1);
      const where = shown.map((line) => `\n      ${line}`).join('');
      return `  ${packageName}  ${handle.message}${where}`;
    });

    return [
      `\n--- open handles (${check.checkType}) ---\n  these kept jest alive after the tests finished; --forceExit killed them\n${handleLines.join('\n')}`,
    ];
  });

  const summaryLines = [runLine, ...checkLines];

  return wardSummaryContract.parse(
    [...summaryLines, ...slowFileLines, ...openHandleLines, ...detailLines].join('\n'),
  );
};
