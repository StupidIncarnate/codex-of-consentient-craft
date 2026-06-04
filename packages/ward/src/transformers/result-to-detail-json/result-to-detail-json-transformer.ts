/**
 * PURPOSE: Transforms a WardResult into trimmed JSON for the detail blob. Structured rawOutput is
 * dropped for every project EXCEPT crash projects — a failing project that produced no structured
 * errors and no test failures (a suite that failed to run/compile). For those the (tail-capped)
 * rawOutput rides along so downstream consumers (spiritmender batcher + web UI) have the actual
 * failure text instead of an empty fail.
 *
 * USAGE:
 * resultToDetailJsonTransformer({ wardResult: WardResultStub() });
 * // Returns JSON string with checks, errors, testFailures, plus rawOutput on crash projects only
 */

import { errorMessageContract, type ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import { rawOutputCapStatics } from '../../statics/raw-output-cap/raw-output-cap-statics';
import { stripAnsiCodesTransformer } from '../strip-ansi-codes/strip-ansi-codes-transformer';

const JSON_INDENT_SPACES = 2;

export const resultToDetailJsonTransformer = ({
  wardResult,
}: {
  wardResult: WardResult;
}): ErrorMessage => {
  const { maxChars } = rawOutputCapStatics.cap;

  const trimmed = {
    runId: wardResult.runId,
    timestamp: wardResult.timestamp,
    checks: wardResult.checks.map((check) => ({
      checkType: check.checkType,
      status: check.status,
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
    })),
  };

  const raw = JSON.stringify(trimmed, null, JSON_INDENT_SPACES);
  const cleaned = stripAnsiCodesTransformer({ text: errorMessageContract.parse(raw) });

  return errorMessageContract.parse(cleaned);
};
