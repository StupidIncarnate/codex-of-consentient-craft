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
import { wardDetailJsonContract } from '../../contracts/ward-detail-json/ward-detail-json-contract';

const STACK_TRACE_PREFIX = 'Stack: ';

export const wardDetailToSpiritmenderBatchesTransformer = ({
  detailJson,
  batchSize,
}: {
  detailJson: ErrorMessage;
  batchSize: number;
}): SpiritmenderBatch[] => {
  const trimmed = detailJson.trim();
  const parseResult = wardDetailJsonContract.safeParse(JSON.parse(trimmed));

  if (!parseResult.success) {
    return [];
  }

  const detail = parseResult.data;
  const fileErrorMap = new Map<AbsoluteFilePath, ErrorMessage[]>();
  const checks = detail.checks ?? [];

  for (const check of checks) {
    const projectResults = check.projectResults ?? [];

    for (const projectResult of projectResults) {
      const errors = projectResult.errors ?? [];

      for (const error of errors) {
        const { filePath } = error;

        if (typeof filePath !== 'string') {
          continue;
        }

        try {
          const absolutePath = absoluteFilePathContract.parse(String(filePath));
          const { message } = error;
          const { line } = error;
          const { column } = error;
          const { rule } = error;

          const errorParts: ErrorMessage[] = [errorMessageContract.parse(String(filePath))];

          if (typeof line === 'number') {
            errorParts.push(errorMessageContract.parse(`:${String(line)}`));
          }

          if (typeof column === 'number') {
            errorParts.push(errorMessageContract.parse(`:${String(column)}`));
          }

          if (typeof message === 'string') {
            errorParts.push(errorMessageContract.parse(` ${String(message)}`));
          }

          if (typeof rule === 'string') {
            errorParts.push(errorMessageContract.parse(` (${String(rule)})`));
          }

          const formattedError = errorMessageContract.parse(errorParts.join(''));

          const existing = fileErrorMap.get(absolutePath) ?? [];
          existing.push(formattedError);
          fileErrorMap.set(absolutePath, existing);
        } catch {
          // Skip errors with invalid file paths
        }
      }

      const testFailures = projectResult.testFailures ?? [];

      for (const failure of testFailures) {
        const { suitePath } = failure;

        if (typeof suitePath !== 'string') {
          continue;
        }

        try {
          const absolutePath = absoluteFilePathContract.parse(String(suitePath));
          const { testName } = failure;
          const { message } = failure;
          const { stackTrace } = failure;

          const failParts: ErrorMessage[] = [errorMessageContract.parse(String(suitePath))];

          if (typeof testName === 'string') {
            failParts.push(errorMessageContract.parse(` - ${String(testName)}`));
          }

          if (typeof message === 'string') {
            failParts.push(errorMessageContract.parse(`: ${String(message)}`));
          }

          if (typeof stackTrace === 'string' && String(stackTrace).length > 0) {
            failParts.push(
              errorMessageContract.parse(` ${STACK_TRACE_PREFIX}${String(stackTrace)}`),
            );
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
