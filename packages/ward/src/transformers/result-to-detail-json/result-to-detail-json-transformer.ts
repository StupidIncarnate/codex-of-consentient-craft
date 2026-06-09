/**
 * PURPOSE: Transforms a WardResult into trimmed JSON for the detail blob. Structured rawOutput is
 * dropped for every project EXCEPT crash projects — a failing project that produced no structured
 * errors and no test failures (a suite that failed to run/compile). For those the (tail-capped)
 * rawOutput rides along so downstream consumers (spiritmender batcher + web UI) have the actual
 * failure text instead of an empty fail. A check with a discovery mismatch (files discovered ≠
 * files processed) — the run-fails-with-no-structured-errors case — is stamped `discoveryMismatch:
 * true` and its projects carry the `onlyDiscovered` / `onlyProcessed` lists, so the web can render
 * the mismatch reason instead of a blank failure. The mismatch verdict (incl. passthrough
 * suppression) is decided HERE via `hasCheckDiscoveryMismatchGuard` — the web only renders it.
 *
 * USAGE:
 * resultToDetailJsonTransformer({ wardResult: WardResultStub() });
 * // Returns JSON string with checks, errors, testFailures, plus rawOutput on crash projects only
 */

import { errorMessageContract, type ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import { rawOutputCapStatics } from '../../statics/raw-output-cap/raw-output-cap-statics';
import { hasCheckDiscoveryMismatchGuard } from '../../guards/has-check-discovery-mismatch/has-check-discovery-mismatch-guard';
import { stripAnsiCodesTransformer } from '../strip-ansi-codes/strip-ansi-codes-transformer';

const JSON_INDENT_SPACES = 2;

export const resultToDetailJsonTransformer = ({
  wardResult,
}: {
  wardResult: WardResult;
}): ErrorMessage => {
  const { maxChars } = rawOutputCapStatics.cap;

  const hasPassthrough =
    Array.isArray(wardResult.filters.passthrough) && wardResult.filters.passthrough.length > 0;

  const trimmed = {
    runId: wardResult.runId,
    timestamp: wardResult.timestamp,
    checks: wardResult.checks.map((check) => {
      const discoveryMismatch = hasCheckDiscoveryMismatchGuard({ check, hasPassthrough });

      return {
        checkType: check.checkType,
        status: check.status,
        // Only stamp the flag when true — a passing run keeps the lean shape downstream snapshots
        // assert against.
        ...(discoveryMismatch ? { discoveryMismatch: true } : {}),
        projectResults: check.projectResults.map((project) => {
          const isCrash =
            project.status === 'fail' &&
            project.errors.length === 0 &&
            project.testFailures.length === 0;

          return {
            projectFolder: project.projectFolder,
            status: project.status,
            errors: project.errors,
            testFailures: project.testFailures,
            passingTests: project.passingTests,
            filesCount: project.filesCount,
            discoveredCount: project.discoveredCount,
            // The discovered-vs-processed file lists ride along ONLY for a mismatched check, so the
            // web can name the unrun files. Omitted otherwise to keep every other blob lean.
            ...(discoveryMismatch
              ? {
                  onlyDiscovered: project.onlyDiscovered,
                  onlyProcessed: project.onlyProcessed,
                }
              : {}),
            ...(isCrash
              ? {
                  rawOutput: {
                    stdout: project.rawOutput.stdout.slice(-maxChars),
                    stderr: project.rawOutput.stderr.slice(-maxChars),
                    exitCode: project.rawOutput.exitCode,
                  },
                }
              : {}),
          };
        }),
      };
    }),
  };

  const raw = JSON.stringify(trimmed, null, JSON_INDENT_SPACES);
  const cleaned = stripAnsiCodesTransformer({ text: errorMessageContract.parse(raw) });

  return errorMessageContract.parse(cleaned);
};
