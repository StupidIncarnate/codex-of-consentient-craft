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
import { openHandleStackStatics } from '../../statics/open-handle-stack/open-handle-stack-statics';
import { slowFileThresholdStatics } from '../../statics/slow-file-threshold/slow-file-threshold-statics';
import { countFailingFilesTransformer } from '../count-failing-files/count-failing-files-transformer';
import { discoveryDiffDisplayTransformer } from '../discovery-diff-display/discovery-diff-display-transformer';
import { firstMeaningfulLineTransformer } from '../first-meaningful-line/first-meaningful-line-transformer';
import { openHandleDisplayTransformer } from '../open-handle-display/open-handle-display-transformer';
import { toCwdRelativePathTransformer } from '../to-cwd-relative-path/to-cwd-relative-path-transformer';
import { hasCheckDiscoveryMismatchGuard } from '../../guards/has-check-discovery-mismatch/has-check-discovery-mismatch-guard';
import { isCrashedProjectResultGuard } from '../../guards/is-crashed-project-result/is-crashed-project-result-guard';

const CHECK_TYPE_PAD = 10;
const MS_PER_SECOND = 1000;

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

    // RANKED ON TEST TIME, never on wall. Wall is jest's `endTime - startTime`, which spans the
    // package's one-time compile and its module evaluation — both charged to whichever suite
    // reaches a module FIRST. Measured: one mcp file read 30.6s wall running first and 1.9s
    // running last, the same tests either way, while the package's one genuinely slow file sat at
    // 2.9s of test bodies in every order. Ranking on wall therefore ranks run position.
    // Only jest reports per-test durations. A check that reports none (lint) has nothing but wall,
    // so it keeps the wall threshold and prints one number.
    const hasTestMs = allTimings.some((ft) => Number(ft.testMs) > 0);
    const slowTimings = hasTestMs
      ? allTimings
          .filter((ft) => Number(ft.testMs) > slowFileThresholdStatics.threshold.testWarnMs)
          .sort((a, b) => Number(b.testMs) - Number(a.testMs))
      : allTimings
          .filter((ft) => Number(ft.durationMs) > slowFileThresholdStatics.threshold.warnMs)
          .sort((a, b) => Number(b.durationMs) - Number(a.durationMs));

    if (slowTimings.length === 0) {
      return [];
    }

    const fileLines = slowTimings.map((ft) => {
      const wall = `${(Number(ft.durationMs) / MS_PER_SECOND).toFixed(1)}s`;
      if (!hasTestMs) {
        return `  ${ft.filePath}  ${wall}`;
      }
      return `  ${ft.filePath}  ${(Number(ft.testMs) / MS_PER_SECOND).toFixed(1)}s in tests (${wall} wall)`;
    });
    const note = hasTestMs
      ? `\n  ranked on test-body time; wall also carries the package's one-time compile, charged to whichever file reached a module first`
      : '';
    return [`\n--- slow files (${check.checkType}) ---${note}\n${fileLines.join('\n')}`];
  });

  // Jest can only collect these from the main thread, so they arrive from FILE-scoped runs and
  // never from a worker run. Reported, not failed: one orchestrator suite leaks an interval on
  // purpose, so reddening on sight would make the signal something people learn to skip past.
  const openHandleLines = wardResult.checks.flatMap((check) => {
    const handles = check.projectResults.flatMap((projectResult) =>
      projectResult.openHandles.map((handle) => ({
        packageName: projectResult.projectFolder.name,
        handle,
      })),
    );

    if (handles.length === 0) {
      return [];
    }

    // GROUPED, because one leak in a shared helper reports once per call. A proxy arming a
    // setImmediate per mock child process filled a screen with nineteen entries carrying the same
    // three frames, and the count is the whole difference between those and nineteen leaks.
    const rendered = handles.map(({ packageName, handle }) =>
      openHandleDisplayTransformer({ packageName, handle, cwd }),
    );
    // Keyed on the suite and the frame that ARMED the handle, not on the whole chain. One proxy
    // arming a setImmediate per mock child process produced nineteen entries differing only in
    // which test line called it, and the fix is one line in that proxy. The chain still prints,
    // taken from the first report in each group.
    const keyed = rendered.map((display) => ({
      display,
      key: String(display).split('\n').slice(0, openHandleStackStatics.summary.keyLines).join('\n'),
    }));
    const distinct = [...new Set(keyed.map((entry) => entry.key))]
      .map((key) => ({
        display: keyed.find((entry) => entry.key === key)?.display ?? key,
        count: keyed.filter((entry) => entry.key === key).length,
      }))
      .sort((left, right) => right.count - left.count);

    const handleLines = distinct
      .slice(0, openHandleStackStatics.summary.maxGroups)
      .map(({ display, count }) => {
        const times = count > 1 ? `${String(count)}x ` : '';
        return display.replace(/^ {2}(\S+) {2}/u, `  $1  ${times}`);
      });
    const moreLine =
      distinct.length > openHandleStackStatics.summary.maxGroups
        ? `\n  ... and ${String(distinct.length - openHandleStackStatics.summary.maxGroups)} more distinct leaks`
        : '';

    return [
      `\n--- open handles (${check.checkType}) ---\n  these kept jest alive after the tests finished; --forceExit killed them\n${handleLines.join('\n')}${moreLine}`,
    ];
  });

  const summaryLines = [runLine, ...checkLines];

  return wardSummaryContract.parse(
    [...summaryLines, ...slowFileLines, ...openHandleLines, ...detailLines].join('\n'),
  );
};
