/**
 * PURPOSE: Transforms a WardResult into trimmed JSON by stripping rawOutput from project results
 *
 * USAGE:
 * resultToDetailJsonTransformer({ wardResult: WardResultStub() });
 * // Returns JSON string with checks, errors, testFailures — no rawOutput blobs
 */

import { errorMessageContract, type ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import { stripAnsiCodesTransformer } from '../strip-ansi-codes/strip-ansi-codes-transformer';

const JSON_INDENT_SPACES = 2;

export const resultToDetailJsonTransformer = ({
  wardResult,
}: {
  wardResult: WardResult;
}): ErrorMessage => {
  const trimmed = {
    runId: wardResult.runId,
    timestamp: wardResult.timestamp,
    checks: wardResult.checks.map((check) => ({
      checkType: check.checkType,
      status: check.status,
      projectResults: check.projectResults.map((project) => ({
        projectFolder: project.projectFolder,
        status: project.status,
        errors: project.errors,
        testFailures: project.testFailures,
        passingTests: project.passingTests,
        filesCount: project.filesCount,
        discoveredCount: project.discoveredCount,
      })),
    })),
  };

  const raw = JSON.stringify(trimmed, null, JSON_INDENT_SPACES);
  const cleaned = stripAnsiCodesTransformer({ text: errorMessageContract.parse(raw) });

  return errorMessageContract.parse(cleaned);
};
