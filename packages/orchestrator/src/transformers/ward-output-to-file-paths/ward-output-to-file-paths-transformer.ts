/**
 * PURPOSE: Extracts deduplicated absolute file paths from structured WardResult JSON
 *
 * USAGE:
 * wardOutputToFilePathsTransformer({ wardResultJson: FileContentsStub({ value: '{"checks":[...]}' }) });
 * // Returns [AbsoluteFilePath('/src/file.ts')]
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
  type FileContents,
} from '@dungeonmaster/shared/contracts';

export const wardOutputToFilePathsTransformer = ({
  wardResultJson,
}: {
  wardResultJson: FileContents;
}): AbsoluteFilePath[] => {
  const parsed: unknown = JSON.parse(wardResultJson);

  if (typeof parsed !== 'object' || parsed === null) {
    return [];
  }

  const checksValue: unknown = Reflect.get(parsed, 'checks');
  const checks: unknown[] = Array.isArray(checksValue) ? checksValue : [];
  const seen = new Set<AbsoluteFilePath>();
  const result: AbsoluteFilePath[] = [];

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

        if (typeof filePath === 'string') {
          try {
            const absolutePath = absoluteFilePathContract.parse(filePath);

            if (!seen.has(absolutePath)) {
              seen.add(absolutePath);
              result.push(absolutePath);
            }
          } catch {
            // Skip paths that fail absolute path validation
          }
        }
      }

      const testFailuresValue: unknown = Reflect.get(projectResult, 'testFailures');
      const testFailures: unknown[] = Array.isArray(testFailuresValue) ? testFailuresValue : [];

      for (const failure of testFailures) {
        if (typeof failure !== 'object' || failure === null) {
          continue;
        }

        const suitePath: unknown = Reflect.get(failure, 'suitePath');

        if (typeof suitePath === 'string') {
          try {
            const absolutePath = absoluteFilePathContract.parse(suitePath);

            if (!seen.has(absolutePath)) {
              seen.add(absolutePath);
              result.push(absolutePath);
            }
          } catch {
            // Skip paths that fail absolute path validation
          }
        }
      }
    }
  }

  return result;
};
