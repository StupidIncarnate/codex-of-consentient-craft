/**
 * PURPOSE: Transforms ward detail JSON into batched file groups for spiritmender processing.
 * Structured lint/typecheck/test failures group by absolute file path. A project that FAILED
 * with no structured errors (a suite that crashed / failed to run) gets a catch-all entry
 * carrying the failing-check summary plus its rawOutput, so a ward failure always yields at
 * least one batch to fix instead of an empty list (which would let ward retry with nothing
 * repaired in between).
 *
 * USAGE:
 * wardDetailToSpiritmenderBatchesTransformer({ detailJson: ErrorMessageStub(), batchSize: 5 });
 * // Returns SpiritmenderBatch[] grouped by file path, plus catch-all batches for crash failures
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
  const crashEntries: { filePath: AbsoluteFilePath | null; errors: ErrorMessage[] }[] = [];
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

      // Crash project: a failing project that produced no structured errors and no test
      // failures (a suite that crashed / failed to run). Synthesize a catch-all entry from
      // the failing-check summary plus its rawOutput so a ward failure never yields zero
      // batches — which would let ward retry with nothing repaired in between.
      if (projectResult.status === 'fail' && errors.length === 0 && testFailures.length === 0) {
        const checkLabel = check.checkType === undefined ? 'check' : String(check.checkType);
        const projectName =
          projectResult.projectFolder?.name === undefined
            ? 'unknown'
            : String(projectResult.projectFolder.name);

        const crashErrors: ErrorMessage[] = [
          errorMessageContract.parse(`${checkLabel}: ${projectName} — FAILED`),
        ];

        const stdout = projectResult.rawOutput?.stdout;
        if (typeof stdout === 'string' && stdout.trim().length > 0) {
          crashErrors.push(errorMessageContract.parse(String(stdout)));
        }

        const stderr = projectResult.rawOutput?.stderr;
        if (typeof stderr === 'string' && stderr.trim().length > 0) {
          crashErrors.push(errorMessageContract.parse(String(stderr)));
        }

        let crashFilePath: AbsoluteFilePath | null = null;
        const folderPath = projectResult.projectFolder?.path;
        if (typeof folderPath === 'string') {
          try {
            crashFilePath = absoluteFilePathContract.parse(String(folderPath));
          } catch {
            crashFilePath = null;
          }
        }

        crashEntries.push({ filePath: crashFilePath, errors: crashErrors });
      }
    }
  }

  const entries: { filePath: AbsoluteFilePath | null; errors: ErrorMessage[] }[] = [
    ...[...fileErrorMap.entries()].map(([filePath, fileErrors]) => ({
      filePath,
      errors: fileErrors,
    })),
    ...crashEntries,
  ];
  const batches: SpiritmenderBatch[] = [];

  for (let i = 0; i < entries.length; i += batchSize) {
    const slice = entries.slice(i, i + batchSize);
    const batchFilePaths: AbsoluteFilePath[] = [];
    const batchErrors: ErrorMessage[] = [];

    for (const entry of slice) {
      if (entry.filePath !== null) {
        batchFilePaths.push(entry.filePath);
      }

      for (const fileError of entry.errors) {
        batchErrors.push(fileError);
      }
    }

    batches.push({ filePaths: batchFilePaths, errors: batchErrors });
  }

  return batches;
};
