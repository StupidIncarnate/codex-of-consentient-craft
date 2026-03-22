/**
 * PURPOSE: Parses a spiritmender batch file JSON into typed filePaths and errors arrays
 *
 * USAGE:
 * parseBatchFileTransformer({ contents: FileContentsStub({ value: '{"filePaths":["/src/a.ts"],"errors":["error msg"]}' }) });
 * // Returns { filePaths: [AbsoluteFilePath], errors: [ErrorMessage] }
 */

import {
  absoluteFilePathContract,
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type FileContents,
} from '@dungeonmaster/shared/contracts';

export const parseBatchFileTransformer = ({
  contents,
}: {
  contents: FileContents;
}): { filePaths: AbsoluteFilePath[]; errors: ErrorMessage[] } => {
  const parsed: unknown = JSON.parse(contents);

  if (typeof parsed !== 'object' || parsed === null) {
    return { filePaths: [], errors: [] };
  }

  const rawFilePaths: unknown = Reflect.get(parsed, 'filePaths');
  const rawErrors: unknown = Reflect.get(parsed, 'errors');

  const filePaths: AbsoluteFilePath[] = [];
  if (Array.isArray(rawFilePaths)) {
    for (const fp of rawFilePaths) {
      if (typeof fp === 'string') {
        try {
          filePaths.push(absoluteFilePathContract.parse(fp));
        } catch {
          // Skip invalid paths
        }
      }
    }
  }

  const errors: ErrorMessage[] = [];
  if (Array.isArray(rawErrors)) {
    for (const err of rawErrors) {
      if (typeof err === 'string') {
        errors.push(errorMessageContract.parse(err));
      }
    }
  }

  return { filePaths, errors };
};
