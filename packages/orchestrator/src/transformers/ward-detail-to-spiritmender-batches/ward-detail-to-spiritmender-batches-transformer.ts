/**
 * PURPOSE: Transforms ward detail JSON into batched file groups for spiritmender processing
 *
 * USAGE:
 * wardDetailToSpiritmenderBatchesTransformer({ detailJson: ErrorMessageStub(), batchSize: 5 });
 * // Returns SpiritmenderBatch[] grouped by file path
 */

import {
  absoluteFilePathContract,
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
} from '@dungeonmaster/shared/contracts';

import type { SpiritmenderBatch } from '../../contracts/spiritmender-batch/spiritmender-batch-contract';

const STACK_TRACE_PREFIX = 'Stack: ';

export const wardDetailToSpiritmenderBatchesTransformer = ({
  detailJson,
  batchSize,
}: {
  detailJson: ErrorMessage;
  batchSize: number;
}): SpiritmenderBatch[] => {
  const trimmed = detailJson.trim();
  const parsed: unknown = JSON.parse(trimmed);

  if (typeof parsed !== 'object' || parsed === null) {
    return [];
  }

  const fileErrorMap = new Map<AbsoluteFilePath, ErrorMessage[]>();

  const checksValue: unknown = Reflect.get(parsed, 'checks');
  const checks: unknown[] = Array.isArray(checksValue) ? checksValue : [];

  for (const check of checks) {
    if (typeof check !== 'object' || check === null) {
      continue;
    }

    const projectResultsValue: unknown = Reflect.get(check, 'projectResults');
    const projectResults: unknown[] = Array.isArray(projectResultsValue) ? projectResultsValue : [];

    for (const projectResult of projectResults) {
      if (typeof projectResult !== 'object' || projectResult === null) {
        continue;
      }

      const errorsValue: unknown = Reflect.get(projectResult, 'errors');
      const errors: unknown[] = Array.isArray(errorsValue) ? errorsValue : [];

      for (const error of errors) {
        if (typeof error !== 'object' || error === null) {
          continue;
        }

        const filePath: unknown = Reflect.get(error, 'filePath');

        if (typeof filePath !== 'string') {
          continue;
        }

        try {
          const absolutePath = absoluteFilePathContract.parse(filePath);
          const message: unknown = Reflect.get(error, 'message');
          const line: unknown = Reflect.get(error, 'line');
          const column: unknown = Reflect.get(error, 'column');
          const rule: unknown = Reflect.get(error, 'rule');

          const errorParts: ErrorMessage[] = [errorMessageContract.parse(filePath)];

          if (typeof line === 'number') {
            errorParts.push(errorMessageContract.parse(`:${String(line)}`));
          }

          if (typeof column === 'number') {
            errorParts.push(errorMessageContract.parse(`:${String(column)}`));
          }

          if (typeof message === 'string') {
            errorParts.push(errorMessageContract.parse(` ${message}`));
          }

          if (typeof rule === 'string') {
            errorParts.push(errorMessageContract.parse(` (${rule})`));
          }

          const formattedError = errorMessageContract.parse(errorParts.join(''));

          const existing = fileErrorMap.get(absolutePath) ?? [];
          existing.push(formattedError);
          fileErrorMap.set(absolutePath, existing);
        } catch {
          // Skip errors with invalid file paths
        }
      }

      const testFailuresValue: unknown = Reflect.get(projectResult, 'testFailures');
      const testFailures: unknown[] = Array.isArray(testFailuresValue) ? testFailuresValue : [];

      for (const failure of testFailures) {
        if (typeof failure !== 'object' || failure === null) {
          continue;
        }

        const suitePath: unknown = Reflect.get(failure, 'suitePath');

        if (typeof suitePath !== 'string') {
          continue;
        }

        try {
          const absolutePath = absoluteFilePathContract.parse(suitePath);
          const testName: unknown = Reflect.get(failure, 'testName');
          const message: unknown = Reflect.get(failure, 'message');
          const stackTrace: unknown = Reflect.get(failure, 'stackTrace');

          const failParts: ErrorMessage[] = [errorMessageContract.parse(suitePath)];

          if (typeof testName === 'string') {
            failParts.push(errorMessageContract.parse(` - ${testName}`));
          }

          if (typeof message === 'string') {
            failParts.push(errorMessageContract.parse(`: ${message}`));
          }

          if (typeof stackTrace === 'string' && stackTrace.length > 0) {
            failParts.push(errorMessageContract.parse(` ${STACK_TRACE_PREFIX}${stackTrace}`));
          }

          const formattedError = errorMessageContract.parse(failParts.join(''));

          const existing = fileErrorMap.get(absolutePath) ?? [];
          existing.push(formattedError);
          fileErrorMap.set(absolutePath, existing);
        } catch {
          // Skip failures with invalid suite paths
        }
      }
    }
  }

  const entries = [...fileErrorMap.entries()];
  const batches: SpiritmenderBatch[] = [];

  for (let i = 0; i < entries.length; i += batchSize) {
    const slice = entries.slice(i, i + batchSize);
    const batchFilePaths: AbsoluteFilePath[] = [];
    const batchErrors: ErrorMessage[] = [];

    for (const [filePath, fileErrors] of slice) {
      batchFilePaths.push(filePath);

      for (const fileError of fileErrors) {
        batchErrors.push(fileError);
      }
    }

    batches.push({ filePaths: batchFilePaths, errors: batchErrors });
  }

  return batches;
};
